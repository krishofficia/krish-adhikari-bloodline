import numpy as np
import csv
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
import os

def cosine_similarity_manual(a, b):
    """Calculate cosine similarity manually using numpy"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)

def read_csv_simple(filename):
    """Read CSV file without pandas"""
    questions = []
    answers = []
    
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            questions.append(row['question'])
            answers.append(row['answer'])
    
    return questions, answers

app = Flask(__name__)

# Load dataset and model
print("Loading chatbot model and data...")

# Load the dataset
questions, answers = read_csv_simple("blood_donation_1000_qa.csv")

# Load the sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load pre-computed embeddings
embeddings = np.load("question_embeddings.npy")

print("Chatbot loaded successfully!")

def chatbot_answer(user_question):
    q = user_question.lower().strip()

    # Greeting handling
    greetings = ["hello", "hi", "hey", "hii", "hlo"]
    if q in greetings:
        return "Hello! I can help you with blood donation related questions."

    # Embed user question
    user_emb = model.encode([user_question])
    # Calculate cosine similarities manually
    sim = []
    for embedding in embeddings:
        sim.append(cosine_similarity_manual(user_emb[0], embedding))
    sim = np.array(sim)

    top_indices = sim.argsort()[-5:][::-1]  # top 5 matches
    top_scores = sim[top_indices]

    # Intent-based matching with improved interval/gap detection
    for idx in top_indices:
        ans = answers[idx].lower()
        dataset_q = questions[idx].lower()

        # a) Interval / Gap questions
        if "gap" in q or "days" in q or "months" in q or "interval" in q:
            if any(keyword in ans for keyword in ["day", "week", "month", "gap", "interval"]) or \
               any(keyword in dataset_q for keyword in ["day", "week", "month", "gap", "interval"]):
                return answers[idx]

        # b) After donation
        if "after" in q and "donat" in q:
            if "after" in ans:
                return answers[idx]

        # c) Before donation
        if "before" in q and "donat" in q:
            if "before" in ans:
                return answers[idx]

        # d) Low hemoglobin / eligibility
        if "hemoglobin" in q or "eligible" in q or "can i donate" in q:
            if "hemoglobin" in ans or "eligible" in ans:
                return answers[idx]

    # Confidence fallback
    if top_scores[0] < 0.65:
        return "Sorry, I can only answer blood donation related questions."

    # Default: best semantic match
    return answers[top_indices[0]]

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
    return jsonify({'status': 'healthy', 'service': 'blood-donation-chatbot'})

if __name__ == '__main__':
    print("Starting Blood Donation Chatbot API on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
