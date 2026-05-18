require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const port = process.env.PORT || 3000;

// middle-ware
app.use(cors());
app.use(express.json());


const admin = require("firebase-admin");
