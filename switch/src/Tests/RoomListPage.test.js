import 'react-testing-library/cleanup-after-each';
import 'jest-dom/extend-expect';
import React from 'react';
import RoomListPage from '../Pages/RoomListPage';
import {render} from 'react-testing-library'
const puppeteer = require('puppeteer');
import ReactShallowRenderer from 'react-test-renderer/shallow';

var ShallowRenderer = require('react-test-renderer/shallow');
jest.setTimeout(30000);
describe('RoomList Page screenshot test', () => {
  test('RoomList page should render correctly', () => {
      const renderer = new ReactShallowRenderer();
      renderer.render(<RoomListPage />);
      expect(renderer.getRenderOutput()).toMatchSnapshot();
  });
});

test("go to game rule page", async()=>{
    const browser = await puppeteer.launch({
          headless: false,
          slowMo: 80,
          args: ['--window-size=1920,1080']
        });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/room-list');
    await page.waitFor('input[name=username]');
    await page.type('input[name=username]','jaric');
    await page.waitFor('input[name=password]');
    await page.type('input[name=password]', 'Rok_W0900');
    await page.click('button[type=submit]');
    await page.waitFor(3000);
    await page.click("button.game-rule-button");
    await page.url('http://localhost:3000/game-rule');
    browser.close();
  });
 
  test("go to my account page", async()=>{
    const browser = await puppeteer.launch({
          headless: false,
          slowMo: 80,
          args: ['--window-size=1920,1080']
        });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/room-list');
    await page.waitFor('input[name=username]');
    await page.type('input[name=username]','jaric');
    await page.waitFor('input[name=password]');
    await page.type('input[name=password]', 'Rok_W0900');
    await page.click('button[type=submit]');
    await page.waitFor(3000);
    await page.click("button.profile-button");
    await page.url('http://localhost:3000/my-account');
    browser.close();
  });

  test("create room", async()=>{
    const browser = await puppeteer.launch({
          headless: false,
          slowMo: 80,
          args: ['--window-size=1920,1080']
        });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/room-list?');
    await page.waitFor('input[name=username]');
    await page.type('input[name=username]','jaric');
    await page.waitFor('input[name=password]');
    await page.type('input[name=password]', 'Rok_W0900');
    await page.click('button[type=submit]');
    await page.waitFor(3000);
    await page.click("button.create-button");
    await page.url(' http://localhost:3000/room');
    browser.close();
  });