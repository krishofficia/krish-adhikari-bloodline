import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)

# Load dataset and model
print("Loading chatbot model and data...")

try:
    # Load the dataset
    df = pd.read_csv("blood_donation_1000_qa.csv")
    questions = df["question"].tolist()
    answers = df["answer"].tolist()
    print(f"Loaded {len(questions)} Q&A pairs")

    # Use TF-IDF instead of sentence transformers (much faster, no download needed)
    print("Initializing TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
    
    # Fit and transform the questions
    question_vectors = vectorizer.fit_transform(questions)
    print("TF-IDF vectorizer initialized successfully!")

    print("Chatbot loaded successfully!")

    def chatbot_answer(user_question):
        q = user_question.lower().strip()

        # Greeting handling
        greetings = ["hello", "hi", "hey", "hii", "hlo"]
        if q in greetings:
            return "Hello! I can help you with blood donation related questions."

        # Simple keyword matching for common questions
        if "how often" in q or "frequency" in q or "interval" in q or "gap" in q:
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["often", "frequency", "interval", "gap", "days", "weeks", "months"]):
                    return answers[i]
        
        if "eat" in q or "food" in q or "before" in q:
            for i, question in enumerate(questions):
                if "eat" in question.lower() or "food" in question.lower() or "before" in question.lower():
                    return answers[i]
        
        if "after" in q and "donat" in q:
            for i, question in enumerate(questions):
                if "after" in question.lower() and "donat" in question.lower():
                    return answers[i]
        
        if "who can" in q or "eligible" in q or "requirements" in q:
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["eligible", "requirements", "who can"]):
                    return answers[i]

        # Use TF-IDF for semantic matching
        user_vector = vectorizer.transform([user_question])
        similarities = cosine_similarity(user_vector, question_vectors)[0]
        
        # Get the best match
        best_match_idx = similarities.argmax()
        best_score = similarities[best_match_idx]
        
        # If confidence is too low, return fallback
        if best_score < 0.3:
            return "Sorry, I can only answer blood donation related questions. Try asking about donation requirements, frequency, or preparation."
        
        return answers[best_match_idx]

    @app.route('/chat', methods=['POST'])
    def chat():
        try:
            data = request.get_json()
            
            if not data or 'message' not in data:
                return jsonify({'error': 'Message is required'}), 400
            
            user_message = data['message']
            
            if not user_message or not user_message.strip():
                return jsonify({'error': 'Message cannot be empty'}), 400
            
            # Get chatbot response
            reply = chatbot_answer(user_message.strip())
            
            return jsonify({'reply': reply})
            
        except Exception as e:
            print(f"Error in chat endpoint: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'service': 'blood-donation-chatbot-tfidf'})

    if __name__ == '__main__':
        print("Starting Blood Donation Chatbot API on http://localhost:5003")
        app.run(host='0.0.0.0', port=5003, debug=False)

except Exception as e:
    print(f"Error initializing chatbot: {e}")
    import sys
    sys.exit(1)
