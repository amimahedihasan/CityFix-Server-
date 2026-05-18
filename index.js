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
        

        // Staff Verify Middle-Ware
        const verifyStaff = async (req, res, next) => {
            const email = req.decoded_email
            const user = await usersCollection.findOne({ email })
            if (!user || user.role !== 'staff') {
                return res.status(403).send({ message: 'Staff only access' })
            }
            next()
        };


        // block
        const verifyNotBlocked = async (req, res, next) => {
            const email = req.decoded_email
            const user = await usersCollection.findOne({ email })
            if (user?.isBlocked) {
                return res.status(403).send({ message: 'Your account is blocked' })
            }
            next()
        };


        // POST: API
        app.post('/issues', async (req, res) => {
            const issue = req.body;
            const { submittedBy } = issue;
            const user = await usersCollection.findOne({ email: submittedBy });
            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }
            if (user.isBlocked) {
                return res.status(403).send({
                message: 'Your account is blocked. You cannot report issues.'
                });
            }
            if (!user.isPremium) {
                const userIssuesCount = await issuesCollection.countDocuments({ submittedBy });
                if (userIssuesCount >= 3) {
                    return res.status(403).send({
                        message: "Free users can submit only 3 issues. Please subscribe for unlimited reporting."
                    });
                }
            }
            const result = await issuesCollection.insertOne(issue);
            res.send(result);
        });


        // issue get api
        app.get('/issues', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 9;
            const skip = (page - 1) * limit;
            const { search = '', status, priority, category, submittedBy } = req.query;
            const query = {};
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } }
                ];
            }
            if (status) query.status = status;
            if (priority) query.isBoosted = priority.toLowerCase() === 'high';
            if (category) query.category = { $regex: category, $options: 'i' };
            if (submittedBy) query.submittedBy = submittedBy;
            const total = await issuesCollection.countDocuments(query);
            const totalPages = Math.ceil(total / limit);
            const issues = await issuesCollection
                .find(query)
                .sort({ isBoosted: -1, priority: -1, upvotes: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            res.send({ issues, totalPages, total });
        });


        // Recently Resolved Api
        app.get('/recent-resolved-issues', async (req, res) =>{
            const cursor = issuesCollection
                .find({ status: "resolved" })
                .sort({ createdAt: -1 })
                .limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });


        // Toggle Upvote API
        app.patch('/issues/upvote/:id', async (req, res) => {
            const issueId = req.params.id;
            const { userEmail } = req.body;
            const issue = await issuesCollection.findOne({ _id: new ObjectId(issueId) });
            if (!issue) return res.status(404).send({ message: "Issue not found" });
            const hasLiked = issue.upvotedUsers?.includes(userEmail);
            let updateDoc;
            if (hasLiked) {
                updateDoc = {
                    $inc: { upvotes: -1 },
                    $pull: { upvotedUsers: userEmail }
                };
            } else {
                updateDoc = {
                    $inc: { upvotes: 1 },
                    $push: { upvotedUsers: userEmail }
                };
            }
            const result = await issuesCollection.updateOne(
                { _id: new ObjectId(issueId) },
                updateDoc
            );
            res.send({ updated: true, liked: !hasLiked });
        });

