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

// const serviceAccount = require("./city-fix-firebase-adminsdk.json");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const verifyFBToken = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access!' });
    }
    try {
        const idToken = token.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.decoded_email = decoded.email;
        next();
    } catch (err) {
        return res.status(401).send({ message: 'Unauthorized access!' });
    }
};

const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASS}@cluster0.w0v9pwr.mongodb.net/?appName=Cluster0`;

// MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try{
        // await client.connect();

        const db = client.db('city_fix_db');
        const issuesCollection = db.collection('issues');
        const usersCollection = db.collection('users');
        const paymentCollection = db.collection('payments');


        // Admin Verify Middle-Ware
        const verifyAdmin = async (req, res, next) => {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });
        if (!user || user.role !== 'admin') {
            return res.status(403).send({ message: 'Admin only access' });
        }
            next();
        };
        
