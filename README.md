# GigScore
**Financial Stability Assessment Engine for Gig Workers**  
*Built for HackMatrix 2026 | IEEE Computer Society | MITS Gwalior*

## Why We Built GigScore
A delivery partner may complete hundreds of orders every month, earn consistently across multiple platforms, and still be rejected for a basic loan because they do not have a traditional salary slip. 

**That is the problem we wanted to solve.**

GigScore is an explainable AI-powered financial assessment engine that helps lenders evaluate gig workers using alternative financial and behavioral signals instead of relying only on salary-based income proof. Our goal is to make credit assessment more transparent, practical, and inclusive for the growing gig economy.

## The Problem
India's gig workforce is expanding rapidly, but many workers remain underserved by formal financial institutions because their income is:
* Irregular across weeks and months
* Spread across multiple platforms
* Difficult to represent through conventional salary documents

As a result, many gig workers face loan rejections, high-interest credit offers, or dependence on informal lenders.

## Our Approach
GigScore converts fragmented financial activity into a structured financial stability assessment that can assist banks, NBFCs, and fintech lenders in making more evidence-based decisions. 

The platform generates:
* **Financial Stability Assessment**
* **Probability of Default (PD)**
* **Approval Probability**
* **Explainable AI insights (SHAP)**
* **Personalized financial coaching recommendations**
* **Lender-friendly decision support reports**

## How It Works

```text
[ Gig Worker ]
      │
      ▼
[ Frontend (React + Tailwind CSS) ]
      │
      ▼
[ FastAPI Backend ]
      │
      ▼
[ GigScore ML Engine ]
      ├── Financial Stability Assessment
      ├── Default Prediction
      ├── Approval Prediction
      └── Explainability Layer
      │
      ▼
[ Worker Dashboard / Lender Dashboard ]
Technology Stack
Frontend: React, Vite, Tailwind CSS

Backend: FastAPI, SQLAlchemy, SQLite

Machine Learning: Python, Scikit-learn, XGBoost, SHAP, NumPy, Pandas

Repository Structure
Plaintext
gigscore/
├── frontend/      # User interface
├── backend/       # FastAPI services
├── ml/            # Financial assessment engine
├── docs/          # Documentation and architecture
└── README.md
Team HackMatrix
Shreesha Kumar P — AI/ML  & Product Architecture

Chethan — Backend & API Engineering

Sameeksha — Frontend & User Experience

Shraddha — Documentation, Integration & Demo Strategy

Current Focus
We are currently working on end-to-end integration across the frontend, backend, and machine learning pipeline, along with explainability validation and demo optimization for HackMatrix 2026.

Note: GigScore is a prototype developed during HackMatrix 2026. It is intended for research, demonstration, and decision-support purposes and does not provide lending services.
