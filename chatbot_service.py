#!/usr/bin/env python3
"""
Blood Donation Chatbot Service
Uses pre-trained SentenceTransformer('all-MiniLM-L6-v2') model
Knowledge base: blood_donation_qa_clean.csv
Precomputed embeddings: question_embeddings.npy
"""

import csv
import math
import numpy as np
from sentence_transformers import SentenceTransformer
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(a * a for a in vec2))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    
    return dot_product / (magnitude1 * magnitude2)

class BloodDonationChatbot:
    def __init__(self):
        """Initialize the chatbot with pre-trained model and dataset"""
        self.model = None
        self.questions = []
        self.answers = []
        self.question_embeddings = None
        self.similarity_threshold = 0.3
        
    def load_model_and_data(self):
        """Load the Sentence Transformer model and dataset"""
        try:
            # Load pre-trained model
            logger.info("Loading Sentence Transformer model...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Model loaded successfully")
            
            # Try to load precomputed embeddings first
            embeddings_path = './question_embeddings.npy'
            csv_path = './blood_donation_qa_clean.csv'
            
            # Fallback to existing files if specified files don't exist
            if not os.path.exists(embeddings_path):
                embeddings_path = None
            if not os.path.exists(csv_path):
                csv_path = './blood_donation_1000_qa.csv'
            
            logger.info(f"Loading dataset from {csv_path}...")
            
            # Read CSV file
            with open(csv_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    self.questions.append(row['question'])
                    self.answers.append(row['answer'])
            
            logger.info(f"✅ Dataset loaded: {len(self.questions)} Q&A pairs")
            
            # Load precomputed embeddings if available
            if embeddings_path and os.path.exists(embeddings_path):
                logger.info(f"Loading precomputed embeddings from {embeddings_path}...")
                self.question_embeddings = np.load(embeddings_path)
                logger.info(f"✅ Precomputed embeddings loaded: {self.question_embeddings.shape}")
            else:
                # Generate embeddings for all questions
                logger.info("Generating embeddings for questions...")
                self.question_embeddings = self.model.encode(
                    self.questions, 
                    convert_to_numpy=True,
                    show_progress_bar=True
                )
                
                # Save embeddings for future use
                try:
                    np.save('./question_embeddings.npy', self.question_embeddings)
                    logger.info("✅ Embeddings saved to question_embeddings.npy")
                except Exception as e:
                    logger.warning(f"Could not save embeddings: {e}")
                
                logger.info(f"✅ Embeddings generated: {self.question_embeddings.shape}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading model and data: {str(e)}")
            return False
    
    def chatbot_answer(self, user_question):
        """
        Main chatbot function that handles user questions
        """
        try:
            if not self.model or self.question_embeddings is None:
                return "Chatbot service is not properly initialized. Please try again later."
            
            # Handle greetings
            user_question_lower = user_question.lower().strip()
            greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']
            if any(greeting in user_question_lower for greeting in greetings):
                return "Hello! I'm your blood donation assistant. I can help you with questions about blood donation eligibility, intervals, safety, and more. How can I assist you today?"
            
            # Generate embedding for user question
            query_embedding = self.model.encode([user_question])
            
            # Calculate cosine similarity
            similarities = []
            for i, question_embedding in enumerate(self.question_embeddings):
                similarity = cosine_similarity(query_embedding[0], question_embedding)
                similarities.append(similarity)
            
            # Find best match
            best_idx = similarities.index(max(similarities))
            best_similarity = similarities[best_idx]
            
            logger.info(f"Best match: similarity={best_similarity:.3f}, index={best_idx}")
            
            # Check if similarity is above threshold
            if best_similarity >= self.similarity_threshold:
                return self.answers[best_idx]
            else:
                # Fallback response for out-of-domain questions
                return "I'm a specialized blood donation chatbot. I can help you with questions about blood donation eligibility, intervals, safety, diet, benefits, and more. Could you please ask me something specifically about blood donation?"
                
        except Exception as e:
            logger.error(f"❌ Error processing question: {str(e)}")
            return "I'm sorry, I encountered an error while processing your question. Please try again."
    
    def get_stats(self):
        """Get chatbot statistics"""
        return {
            "total_qa_pairs": len(self.questions),
            "model_name": "all-MiniLM-L6-v2",
            "similarity_threshold": self.similarity_threshold,
            "status": "ready" if self.model and self.question_embeddings is not None else "not_ready"
        }

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize chatbot
chatbot = BloodDonationChatbot()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    stats = chatbot.get_stats()
    return jsonify({
        "status": "healthy",
        "chatbot": stats
    })

@app.route('/chatbot', methods=['POST'])
def chatbot_endpoint():
    """Main chatbot endpoint as specified in requirements"""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({
                "error": "Missing 'question' field in request"
            }), 400
        
        user_question = data['question'].strip()
        
        if not user_question:
            return jsonify({
                "error": "Question cannot be empty"
            }), 400
        
        # Get chatbot response
        answer = chatbot.chatbot_answer(user_question)
        
        return jsonify({
            "answer": answer,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"❌ Chatbot endpoint error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "answer": "I'm sorry, I encountered an error. Please try again."
        }), 500

@app.route('/stats', methods=['GET'])
def stats():
    """Get chatbot statistics"""
    return jsonify(chatbot.get_stats())

if __name__ == '__main__':
    # Load model and data before starting server
    if chatbot.load_model_and_data():
        logger.info("🚀 Starting chatbot service on port 5000...")
        app.run(host='127.0.0.1', port=5000, debug=False)
    else:
        logger.error("❌ Failed to initialize chatbot service")
        exit(1)
