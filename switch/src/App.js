import React, { Component } from 'react';
import aws_config from "./aws-exports";
import Amplify from '@aws-amplify/core';
import { withRouter } from "react-router-dom";
import './App.css';
import img from './img/background.png';
import Game from './Pages/phaser/Game'

Amplify.configure(aws_config);

class App extends Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    /**
     * This function handles login button click in home page,
     * which directs to the room list page(which requires login first)
     * @param {event} e 
     */
    handleClick(e) {
        e.preventDefault();
        this.props.history.push('/room-list');
    }
    /**
     * Renders home page
     */
    render() {
        return (
                <div className="home">
                    <img src={img} className="home-img" />
                    <h1 className="home-header">WELCOME TO SWITCH</h1>
                    <div>
                        <button className="login-button" onClick={this.handleClick}>Login</button>
                    </div>
                </div>
        )
    }
}

export default withRouter(App);
