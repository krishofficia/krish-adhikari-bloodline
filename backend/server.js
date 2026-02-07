/* ============================================
   BLOODLINE - Backend Server
   Express.js server with MongoDB database
   ============================================ */

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const natural = require('natural');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const bloodRequestRoutes = require('./routes/bloodRequests');
const adminRoutes = require('./routes/admin');

// Import database connection
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'file://'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/admin', adminRoutes);

// API routes should be defined before static file serving
// Static file serving will be added after API routes

// ============================================
// AI CHATBOT - NLP-BASED TRAINING SYSTEM
// ============================================

/**
 * CHATBOT TRAINING EXPLANATION (Academic Context):
 * 
 * This chatbot uses Natural Language Processing (NLP) techniques:
 * 1. TOKENIZATION: Breaks down text into individual words/tokens
 * 2. TF-IDF VECTORIZATION: Converts text into numerical vectors based on:
 *    - Term Frequency (TF): How often a word appears in a document
 *    - Inverse Document Frequency (IDF): How rare/common a word is across all documents
 * 3. COSINE SIMILARITY: Measures similarity between user query and training data
 * 
 * Training Process:
 * - Loads domain-specific FAQ dataset (blood_faq.json)
 * - Preprocesses questions (tokenization, stemming, stopword removal)
 * - Creates TF-IDF vectors for each FAQ question
 * - When user asks a question, converts it to TF-IDF vector
 * - Finds most similar FAQ using cosine similarity
 * - Returns corresponding answer if similarity threshold is met
 * 
 * This is a supervised learning approach using similarity-based matching,
 * suitable for domain-specific Q&A without requiring deep learning models.
 */

// Load training data (FAQ dataset)
let faqData = [];
try {
    const faqFile = fs.readFileSync('./blood_faq.json', 'utf8');
    faqData = JSON.parse(faqFile);
    console.log(`✅ Chatbot training data loaded: ${faqData.length} FAQ entries`);
} catch (error) {
    console.error('❌ Error loading FAQ data:', error.message);
    faqData = [];
}

// Initialize NLP tools
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Preprocess text: tokenize, lowercase, remove stopwords, stem
function preprocessText(text) {
    if (!text) return '';
    
    // Convert to lowercase
    text = text.toLowerCase();
    
    // Tokenize (split into words)
    const tokens = tokenizer.tokenize(text) || [];
    
    // Remove stopwords and stem
    const stopwords = natural.stopwords; // Common words like 'the', 'is', 'a', etc.
    const processedTokens = tokens
        .filter(token => token.length > 2) // Remove very short tokens
        .filter(token => !stopwords.includes(token)) // Remove stopwords
        .map(token => stemmer.stem(token)); // Stem words (running -> run)
    
    return processedTokens.join(' ');
}

// Build TF-IDF model from FAQ questions
let tfidf = new TfIdf();
const processedQuestions = [];

// Process and add all FAQ questions to TF-IDF model
faqData.forEach((faq, index) => {
    const processed = preprocessText(faq.question);
    processedQuestions.push({
        original: faq.question,
        processed: processed,
        answer: faq.answer,
        index: index
    });
    tfidf.addDocument(processed);
});

console.log(`✅ TF-IDF model trained on ${processedQuestions.length} questions`);

/**
 * Find best matching FAQ using cosine similarity
 * @param {string} userQuery - User's question
 * @returns {object} Best match with similarity score
 */
function findBestMatch(userQuery) {
    if (processedQuestions.length === 0) {
        return null;
    }
    
    // Preprocess user query
    const processedQuery = preprocessText(userQuery);
    
    // Calculate TF-IDF vector for user query
    const queryTfidf = new TfIdf();
    queryTfidf.addDocument(processedQuery);
    
    // Calculate cosine similarity with each FAQ question
    let bestMatch = null;
    let bestScore = 0;
    
    processedQuestions.forEach((faq, index) => {
        // Get TF-IDF values for query and document
        const queryVector = [];
        const docVector = [];
        const allTerms = new Set();
        
        // Collect all terms
        queryTfidf.listTerms(0).forEach(item => allTerms.add(item.term));
        tfidf.listTerms(index).forEach(item => allTerms.add(item.term));
        
        // Build vectors
        allTerms.forEach(term => {
            const queryTfidfValue = queryTfidf.tfidf(term, 0) || 0;
            const docTfidfValue = tfidf.tfidf(term, index) || 0;
            queryVector.push(queryTfidfValue);
            docVector.push(docTfidfValue);
        });
        
        // Calculate cosine similarity
        const dotProduct = queryVector.reduce((sum, val, i) => sum + val * docVector[i], 0);
        const queryMagnitude = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0));
        const docMagnitude = Math.sqrt(docVector.reduce((sum, val) => sum + val * val, 0));
        
        let similarity = 0;
        if (queryMagnitude > 0 && docMagnitude > 0) {
            similarity = dotProduct / (queryMagnitude * docMagnitude);
        }
        
        // Update best match
        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = {
                question: faq.original,
                answer: faq.answer,
                similarity: similarity,
                index: index
            };
        }
    });
    
    return bestMatch;
}

/**
 * Chatbot response generator
 * @param {string} userMessage - User's question
 * @returns {string} Chatbot's response
 */
function getChatbotResponse(userMessage) {
    // Check if message is related to blood donation
    const bloodDonationKeywords = [
        'blood', 'donate', 'donation', 'donor', 'plasma', 'platelet',
        'eligibility', 'safety', 'side effect', 'benefit', 'interval',
        'gap', 'diet', 'food', 'exercise', 'age', 'weight', 'health'
    ];
    
    const messageLower = userMessage.toLowerCase();
    const isRelated = bloodDonationKeywords.some(keyword => 
        messageLower.includes(keyword)
    );
    
    // If not related to blood donation, return fallback
    if (!isRelated && processedQuestions.length > 0) {
        return "I'm a specialized chatbot for blood donation information. I can help you with questions about blood donation intervals, eligibility, safety, diet, benefits, and more. Could you please ask me something related to blood donation?";
    }
    
    // Find best matching FAQ
    const match = findBestMatch(userMessage);
    
    // Similarity threshold: if similarity is too low, return fallback
    const SIMILARITY_THRESHOLD = 0.1; // Adjust based on testing
    
    if (match && match.similarity >= SIMILARITY_THRESHOLD) {
        return match.answer;
    } else {
        return "I understand you're asking about blood donation, but I couldn't find a precise answer in my knowledge base. Could you please rephrase your question? I can help with topics like donation intervals, eligibility criteria, diet recommendations, safety information, and benefits of blood donation.";
    }
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Bloodline API is running' });
});

// ============================================
// AI CHATBOT API ENDPOINT
// ============================================

/**
 * POST /chatbot
 * Forward user question to Python Flask API and return answer
 * 
 * Request Body:
 * {
 *   "question": "user question here"
 * }
 * 
 * Response:
 * {
 *   "answer": "chatbot answer"
 * }
 */
app.post('/chatbot', async (req, res) => {
    try {
        const { question } = req.body;

        // Validation
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Question is required and must be a non-empty string' 
            });
        }

        console.log('Forwarding question to Python chatbot service...');
        
        // Call Python Flask API
        const chatbotResponse = await fetch('http://127.0.0.1:5000/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question.trim() })
        });

        console.log('Python chatbot service response status:', chatbotResponse.status);

        if (!chatbotResponse.ok) {
            console.error('Python chatbot service error response:', chatbotResponse.statusText);
            throw new Error(`Python chatbot service responded with ${chatbotResponse.status}`);
        }

        const data = await chatbotResponse.json();
        console.log('Python chatbot service response:', data);
        
        // Return answer from Python service
        res.json({ 
            answer: data.answer || "I'm sorry, I couldn't process your request."
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        
        // Fallback to basic response if Python service is unavailable
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
            res.json({ 
                answer: "I'm a specialized blood donation chatbot. I can help you with questions about blood donation eligibility, intervals, safety, diet, benefits, and more. The AI service is currently starting up, please try again in a moment."
            });
        } else {
            res.status(500).json({ 
                error: 'Server error while processing chat request',
                answer: "I'm sorry, I encountered an error. Please try again or rephrase your question."
            });
        }
    }
});

// Serve static files AFTER API routes (for SPA routing)
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB and start server
connectDB().then(() => {
    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Bloodline server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
        console.log(`🩸 MongoDB connected successfully`);
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing database:', error.message);
        process.exit(1);
    }
});

