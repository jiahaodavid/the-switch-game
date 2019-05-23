import React, { Component } from 'react';
import RoomListPage from './RoomListPage';
import './RoomPage.css';
import Game from './phaser/Game';
import { withAuthenticator } from 'aws-amplify-react';
import { withRouter } from 'react-router-dom';
import * as mutations from '../graphql/mutations';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import aws_config from '../aws-exports';
import { Auth } from 'aws-amplify';
import * as queries from './phaser/../../graphql/queries';
import Amplify, { API, graphqlOperation } from "aws-amplify";
import { Button, Card } from 'react-bootstrap';
import { SelectMFAType } from 'aws-amplify-react/dist/Widget';
import { type } from 'os';


/**
 * A string for Appsync subscription to update the room
 * @constant {string}
 */
  const subtoRoomData2 = `
  subscription{
    onUpdateReadyPageTable{
        roomID players readyStatus cards GameStart
    }
  }
  `
 
/**
 * This component is the page for ready room.
 * It will render after the user was entered into the room,
 * and redirect to /room.
 */
class RoomPage extends React.Component {
    constructor() {
        super();
        this.state={
            showGame: false,
            
            isReady: false,
            num_ready: 0,
            roomOwner : false,
            playersList : ['p1','p2','p3','p4'],
            roomid : Number,
            str : ['Not Ready ....','Not Ready ....','Not Ready ....','Not Ready ....']
        }
        this.handleBackClick = this.handleBackClick.bind(this);
        this.handleStartClick = this.handleStartClick.bind(this);
        this.handleReadyClick = this.handleReadyClick.bind(this);
        this.showReadyButton = this.showReadyButton.bind(this);
        this.showStartButton = this.showStartButton.bind(this);
    }


    async componentDidMount(){
        this.waitAndGetList();
        const data = this.props.location.query;
        console.log('data from list '+data);
        this.setState({roomid:data});

        this.subU = API.graphql(
            graphqlOperation(subtoRoomData2)
        ).subscribe({
            next: (roomData) =>{
            
                this.setPlayers();
                this.setRoomOwner();
                this.setReadyStatus();
                this.setReadyNum();
                this.setGameStart();
            }
        });
        


    
    }
    componentWillUnmount() {

        this.subU.unsubscribe();

      }
   /**
     * Gets the number of people readied in the current room from the database
     * and set it to num_ready state.
     */
    async setReadyNum(){
        const data = this.props.location.query;
        const getData = await API.graphql(graphqlOperation(queries.getReadyPageTable,{
            roomID : data
        }));
        const readyNumber = getData.data.getReadyPageTable.readyNum;
        this.setState({
            num_ready : readyNumber
        })
    } 
  /**
     * Gets the boolean value whether or not the game is started by room master from the database,
     * and set it to showGame state.
     */
    async setGameStart(){
        const data = this.props.location.query;
        const getData = await API.graphql(graphqlOperation(queries.getReadyPageTable,{
            roomID : data
        }));
        const start = getData.data.getReadyPageTable.GameStart;
        this.setState({
            showGame : start
        })
    }
  /**
     * Gets the ready status of other three players in the current room from the database
     * and set it to str state.
     */
    async setReadyStatus(){
        const data = this.props.location.query;
        const getPlayers = await API.graphql(graphqlOperation(queries.getReadyPageTable,{
            roomID : data
        }));
        const temp = [];
      
        for(let i=0;i<getPlayers.data.getReadyPageTable.readyStatus.length;i++){
            temp.push(getPlayers.data.getReadyPageTable.readyStatus[i]);
            }
        this.setState({
            str : temp
        })
    }
  /**
     * Set the roomOwner state to true if the user is the first one in the array from the database.
     */
    async setRoomOwner(){
        const getUser = await Auth.currentAuthenticatedUser();
        const name = getUser.username;
        const data = this.props.location.query;
        console.log('data from list '+data);
        const getPlayers = await API.graphql(graphqlOperation(queries.getRoompage,{
            roomid : data
        }));
        const list = getPlayers.data.getRoompage.players;
        if (list[0] == name ){
            this.setState({
                roomOwner : true
            })
        }

    }
   /**
     * Gets the current room info after 1 second.
     */
    async waitAndGetList() {
        console.log('Just~~~~~~~~');
        await this.sleep(250);
        console.log('wait 1 second');
        this.setPlayers();
        this.setRoomOwner();
        this.setReadyStatus()
       
      }
   /**
     * Returns a promise.
     * @param {number} ms 
     * @returns {Promise}
     */
      sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
    /**
     * Gets the list of players in the current room.
     */  
    
    getPlayersByID(){
        (async () => {
            
            const getUser = await Auth.currentAuthenticatedUser();
            const name = getUser.username;
            const getRoomID = await API.graphql(graphqlOperation(queries.getQw,{
                username : name
            }));
            const result = getRoomID.data.getQw.roomID;
            console.log('the name is '+ name);
            console.log('roomid ' + result);
            console.log('type of result : ' +typeof(result));
            const getPlayersInTheRoom = await API.graphql(graphqlOperation(queries.getRoompage,{
                roomid : result
            }))
            const playerlist = getPlayersInTheRoom.data.getRoompage.players;
            console.log('players you have : '+ playerlist);
            console.log('type of playerlist : '+ typeof(playerlist));
            console.log('player 1 is ' + playerlist[0] );

        })();
    }
   /**
     * Sets the playersList state to the array of players
     */
    async setPlayers(){
        const data = this.props.location.query;
        console.log('check at fun ' + data);
        (async () => {
            const getPlayers = await API.graphql(graphqlOperation(queries.getRoompage,{
                roomid : data
            }));
            
            const list = getPlayers.data.getRoompage.players;
            this.setState({
                playersList : list
            })
            
         
        })();
    }
   /**
     * Handles the "back" button click.
     * The info of the user who clicked "back" button will be removed from the database of this room.
     * @param {event} e 
     */
    handleBackClick(e) {
        e.preventDefault();
        this.setState({
            showGame: false
        })
        if(this.state.isReady == true || this.state.roomOwner == true){
            (async () => {
                const storelist = [];
                const getUser = await Auth.currentAuthenticatedUser();
                const name = getUser.username;
                const data = this.props.location.query;
                const getPlayers = await API.graphql(graphqlOperation(queries.getRoompage,{
                roomid : data
                }));
                const getNumber = await API.graphql(graphqlOperation(queries.getReadyPageTable,{
                    roomID : data
                    }));
                const number = getNumber.data.getReadyPageTable.readyNum;
                console.log('ready number ' + number);
                
                
                for(let i=0;i<getPlayers.data.getRoompage.players.length;i++){
                    storelist.push(getPlayers.data.getRoompage.players[i]);
                    }
                var index = storelist.findIndex(num => num === name);
                
                var newstr = this.state.str;
                newstr[index] = 'Not Ready ....';
                await API.graphql(graphqlOperation(mutations.updateReadyPageTable,{
                    input:{
                        roomID : data,
                        readyNum : number-1,
                        readyStatus : newstr
                    }}));
            })();
        }
        const data = this.props.location.query;
        console.log('data from list '+data);
        (async () => {
            const getUser = await Auth.currentAuthenticatedUser();
            const name = getUser.username;
            const getPlayers = await API.graphql(graphqlOperation(queries.getRoompage,{
                roomid : data
            }));
            const list = getPlayers.data.getRoompage.players;
            const result = list.filter(players => players != name);
            await API.graphql(graphqlOperation(mutations.updateReadyPageTable,{
                input : {
                    roomID : data,
                    players : result
                }
            }));
            await API.graphql(graphqlOperation(mutations.updateRoompage,{
                input : {
                    roomid : data,
                    players : result
                }
            }));
            console.log(typeof(result));
            var count=0;
            for (var property in result) {
                if (Object.prototype.hasOwnProperty.call(result, property)) {
                    count++;
                }
            }
            if(count == 0){
                await API.graphql(graphqlOperation(mutations.deleteRoompage,{
                    input:{
                        roomid : data
                    }
                }))
                await API.graphql(graphqlOperation(mutations.deleteReadyPageTable,{
                    input:{
                        roomID : data
                    }
                }))
            }
        })();
        (async()=>{
        const getUser = await Auth.currentAuthenticatedUser();
        const name = getUser.username;
        await API.graphql(graphqlOperation(mutations.deleteQw, 
            {
                input:{
                    username : name,
                }
            }));
        })();
        this.props.history.push('/room-list')
    }

  /**
     * Handles the "start" buttton click, which only the room master has.
     * It will set GameStart attribute in the database of this room to be true.
     * @param {event} e 
     */

    async handleStartClick(e) {
        e.preventDefault();
        //need to check if the room has 4 players, otherwise cannot start the game as well
        this.setState({
            showGame: true

        });
        const data = this.props.location.query;
        await API.graphql(graphqlOperation(mutations.updateReadyPageTable,{
            input:{ 
                roomID : data,
                GameStart : true 
            }}));
    }
/**
     * Handles the "ready" butotn click, which the three players in the room have.
     * Updates the current room info in the database.
     * If the current isReady state for the user is true, 
     * then it will set isReady state to false and decrease readyNum state by 1.
     * Otherwise, it will set isReady state to true and increase readyNum state by 1.
     * @param {event} e 
     */
    async handleReadyClick(e) {
        e.preventDefault();
        


        if(this.state.isReady == true || this.state.roomOwner == true) {
            this.setState({
                num_ready: this.state.num_ready-1,
                isReady : false
            });
                
                const storelist = [];
                const getUser = await Auth.currentAuthenticatedUser();
                const name = getUser.username;
                const data = this.props.location.query;
                const getPlayers = await API.graphql(graphqlOperation(queries.getRoompage,{
                roomid : data
                }));
                const getNumber = await API.graphql(graphqlOperation(queries.getReadyPageTable,{
                    roomID : data
                    }));
                const number = getNumber.data.getReadyPageTable.readyNum;
                console.log('ready number ' + number);
                
                
                for(let i=0;i<getPlayers.data.getRoompage.players.length;i++){
                    storelist.push(getPlayers.data.getRoompage.players[i]);
                    }
                var index = storelist.findIndex(num => num === name);
                
                var newstr = this.state.str;
                newstr[index] = 'Not Ready ....';
                await API.graphql(graphqlOperation(mutations.updateReadyPageTable,{
                    input:{
                        roomID : data,
                        readyNum : number-1,
                        readyStatus : newstr
                    }}));
                this.setState({
                str : newstr
                })    
        }
        else{
         this.setState({
                num_ready: this.state.num_ready+1 , isReady: !this.state.isReady
            });   
        
            
            const storelist = [];
            const getUser = await Auth.currentAuthenticatedUser();
            const name = getUser.username;
            const data = this.props.location.query;
            const getPlayers = await API.graphql(graphqlOperation(queries.getRoompage,{
            roomid : data
            }));
            const getNumber = await API.graphql(graphqlOperation(queries.getReadyPageTable,{
                roomID : data
                }));
            const number = getNumber.data.getReadyPageTable.readyNum;
            console.log('ready number ' + number);
            
            const list = getPlayers.data.getRoompage.players;
            for(let i=0;i<getPlayers.data.getRoompage.players.length;i++){
                storelist.push(getPlayers.data.getRoompage.players[i]);
                }
            var index = storelist.findIndex(num => num === name);
            console.log('index is ' +index);
            var newstr = this.state.str;
            newstr[index] = 'Ready !!!!!!!!!!!';
            await API.graphql(graphqlOperation(mutations.updateReadyPageTable,{
                input:{
                    roomID : data,
                    readyNum : number+1,
                    readyStatus : newstr
                }
            }));
            this.setState({
            str : newstr
            })    
            
    
       
    }
    }
/**
     * This function will show "ready" button if the current isReady state is false.
     * Otherwise, it will show "unready" button.
     */
    showReadyButton() {
    if(this.state.roomOwner == false){    
        if (this.state.isReady == true) {
            
            return (
                <Button className="unready-button" variant="danger" onClick={this.handleReadyClick}>Unready</Button>
            )
        }
        else {
            return (
                <Button className="ready-button" variant="success" onClick={this.handleReadyClick}>Ready</Button>
            )
        }
    }
    }
 /**
     * This function checks if the user is room master and
     * if num_ready state is equal to 3, which means all players are ready to start gaming.
     * Otherwise, the "start" button will be disabled.
     */
    showStartButton() {
        if(this.state.num_ready == 3 && this.state.roomOwner == true) {
            return (
                <Button className="start-button" variant="success" onClick={this.handleStartClick}>Start</Button>
            )
        }
        else {
            return(
                <Button className="disabled-start-button" variant="secondary" disabled>Start</Button>
            )
        }
    }
/**
     * If parameter i is equal to 0, the function will return a card for displaying room master's info.
     * Otherwise, it will return a card for displaying a player's info.
     * @param {number} i - index 
     */
    //only show button under the player's own card
    showPlayer(i) {
        if(i == 0){
            return(
                <Card bg="warning" style={{width: '20rem'}} className="master-card">
                    <Card.Body>
                        <Card.Title>Room Master : {this.state.playersList[0]}</Card.Title>
                        { this.showStartButton() }
                    </Card.Body>
                </Card>
            )
        }
        else {
            if(this.state.isReady == true){
                return(
                    
                    <Card  style={{width: '20rem'}} className="player-card">
                        
                        <Card.Body>
                            
                            <Card.Title bg='success'>Player {i} :{this.state.playersList[i]}</Card.Title>
                            {/* { this.showReadyButton() } */}
                            
                        </Card.Body>
                        <Card.Footer>
                            {this.state.str[i]}  
                        </Card.Footer>
                    </Card>
                    
                )
            }
            else {
                return(
                    <Card style={{width: '20rem'}} className="player-card">
                        
                        <Card.Body>
                            
                            <Card.Title>Player {i} :{this.state.playersList[i]}</Card.Title>
                            {/* { this.showReadyButton() } */}
                           
                        </Card.Body>
                        <Card.Footer>
                            {this.state.str[i]}  
                        </Card.Footer>
                    </Card>
                )
            }
        }
    }


    render() {
        return(
            <div className="room">
                <head>
                    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous" />
                </head>
                <Button className="room-back-button" variant="secondary" onClick={this.handleBackClick}>Back</Button>
                { this.state.showGame ? this.props.history.push('/gameRunning') : 
                    <div>
                        <h1 className="room-header">Room #{this.state.roomid}</h1>
                        {this.showReadyButton()} 
                        <br />
                        { this.showPlayer(0) }
                        <br />
                        { this.showPlayer(1) }
                        <br />
                        { this.showPlayer(2) }
                        <br />
                        { this.showPlayer(3) }
                    </div>
                }
            </div>
        );
    }
}


export default withRouter(withAuthenticator(RoomPage,true));


