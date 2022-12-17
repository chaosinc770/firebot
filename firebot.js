// Firebot. Written by Chaosinc. Be good to the world
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const fs = require('fs');
const parseString = require('xml2js').parseString;

const verbose = true;

// Replace <TOKEN> with your bot's token
const bot = new TelegramBot('Put your telegram bot token here', {polling: true});

// Replace <CHANNEL> with the name of your channel
const channel = '@telegramchannel';

// Replace <FEED_URL> with the URL of the first RSS feed
const feedUrl = 'rss feed link 1';

// Replace <FEED_URL2> with the URL of the second RSS feed
const feedUrl2 = 'rss feed link 2';

// Keep track of last post
let lastPost1 = '';
let lastPost2 = '';

// This function will be called every time a feed updates
function onFeedUpdate(feed, feedNumber) {
  // Use the parseString method from the xml2js library to parse the XML string into a JavaScript object
  parseString(feed, (err, result) => {
    if (err) {
      // If there is an error parsing the XML, log it to the firebot.log file
      if (verbose) {
        fs.appendFileSync('firebot.log', `Error parsing feed #${feedNumber} at ${new Date()}: ${err}\n`);
      }
      return;
    }

    // Get the title of the first item in the RSS feed
    const title = result.rss.channel[0].item[0].title[0];

    // Check if the post is different from the last post
    if (title !== lastPost1 && title !== lastPost2) {
      // Use the "HTML" parse mode to allow for formatting such as line breaks and bold text
      // Set the "disable_web_page_preview" option to "true" to prevent the message from showing a preview of a linked webpage
      bot.sendMessage(channel, title, { parse_mode: "HTML", disable_web_page_preview: true });

      if (verbose) {
        // Write a log message to the firebot.log file
        fs.appendFileSync('firebot.log', `Sent updated feed #${feedNumber} to ${channel} at ${new Date()}\n`);
      }
      // Update the last post
      if (feedNumber === 1) {
        lastPost1 = title;
      } else {
        lastPost2 = title;
      }
    }
  });
}

// This function will run in an infinite loop to check for updates to a feed
function startPolling(feedUrl, feedNumber) {
  // First, get the current feed
  request(feedUrl, (error, response, body) => {
    if (error) {
      // If there is an error, log it to the firebot.log file
      if (verbose) {
        fs.appendFileSync('firebot.log', `Error getting feed #${feedNumber} at ${new Date()}: ${error}\n`);
      }
      return;
    }

    // Save the current feed
    let currentFeed = body;

    // Check for updates to the feed every 10 seconds
    setInterval(() => {
      request(feedUrl, (error, response, body) => {
        if (error) {
          // If there is an error, log it to the firebot.log file
          if (verbose) {
            fs.appendFileSync('firebot.log', `Error getting feed #${feedNumber} at ${new Date()}: ${error}\n`);
          }
          return;
        }

        // If the feed has been updated, call the onFeedUpdate function
        if (body !== currentFeed) {
          onFeedUpdate(body, feedNumber);
        }
      });
    }, 10000);
  });
}

// Start polling the two feeds
startPolling(feedUrl, 1);
startPolling(feedUrl2, 2);

console.log('Firebot is running!');
