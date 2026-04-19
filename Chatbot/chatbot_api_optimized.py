import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
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

    # Enhanced TF-IDF vectorizer with better parameters
    print("Initializing enhanced TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        stop_words=list(ENGLISH_STOP_WORDS),
        max_features=2000,
        ngram_range=(1, 2),  # Use bigrams for better context
        min_df=1,
        max_df=0.9,
        sublinear_tf=True
    )
    
    # Fit and transform the questions
    question_vectors = vectorizer.fit_transform(questions)
    print("Enhanced TF-IDF vectorizer initialized successfully!")

    print("Optimized chatbot loaded successfully!")

    def chatbot_answer(user_question):
        q = user_question.lower().strip()

        # Greeting handling
        greetings = ["hello", "hi", "hey", "hii", "hlo", "good morning", "good afternoon"]
        if q in greetings:
            return "Hello! I can help you with blood donation related questions. Ask me about eligibility, donation process, or preparation."

        # Enhanced keyword matching for common questions
        if any(keyword in q for keyword in ["how often", "frequency", "interval", "gap", "donation frequency"]):
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["often", "frequency", "interval", "gap", "days", "weeks", "months", "donation frequency"]):
                    return answers[i]
        
        if any(keyword in q for keyword in ["eat", "food", "before", "prepare", "preparation"]):
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["eat", "food", "before", "prepare", "preparation", "diet"]):
                    return answers[i]
        
        if any(keyword in q for keyword in ["after", "post", "following"]):
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["after", "post", "following", "donate"]):
                    return answers[i]
        
        if any(keyword in q for keyword in ["who can", "eligible", "requirements", "can donate", "qualify"]):
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["eligible", "requirements", "who can", "qualify", "criteria"]):
                    return answers[i]

        if any(keyword in q for keyword in ["side effects", "risks", "danger", "harm", "safe"]):
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["side effects", "risks", "danger", "harm", "safe", "complications"]):
                    return answers[i]

        if any(keyword in q for keyword in ["blood type", "blood group", "type", "group"]):
            for i, question in enumerate(questions):
                if any(keyword in question.lower() for keyword in ["blood type", "blood group", "type", "group"]):
                    return answers[i]

        # Use TF-IDF for semantic matching with improved scoring
        user_vector = vectorizer.transform([user_question])
        similarities = cosine_similarity(user_vector, question_vectors)[0]
        
        # Get top 3 matches and apply additional filtering
        top_indices = similarities.argsort()[-3:][::-1]
        top_scores = similarities[top_indices]
        
        # Enhanced confidence calculation
        best_match_idx = top_indices[0]
        best_score = top_scores[0]
        
        # Lower threshold for better coverage
        if best_score < 0.2:
            return "I can only answer blood donation related questions. Try asking about eligibility requirements, donation frequency, preparation before donation, or what happens after donation."
        
        # Return the best match
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
        return jsonify({'status': 'healthy', 'service': 'blood-donation-chatbot-optimized'})

    if __name__ == '__main__':
        print("Starting Optimized Blood Donation Chatbot API on http://localhost:5002")
        app.run(host='0.0.0.0', port=5002, debug=False)

except Exception as e:
    print(f"Error initializing chatbot: {e}")
    import sys
    sys.exit(1)
