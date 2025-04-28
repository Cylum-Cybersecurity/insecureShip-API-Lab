# InsecureShip

InsecureShip is a deliberately vulnerable REST API built with Node.js that simulates a shipping and package delivery management platform. This **basic and minimalist** project was created for educational purposes only to demonstrate common API security vulnerabilities and misconfigurations in an easy-to-understand format.

The application features different access levels (Customer, Employee, Manager, Admin), package tracking, delivery management, and payment processing - all implemented with intentional security flaws that showcase the OWASP API Top 10 2023 vulnerabilities in a straightforward, educational manner.


## Warning: Intentionally Vulnerable

This application is **vulnerable by default** and intentionally incorporates numerous security anti-patterns and bad practices that are easy to identify, including:

- Hardcoded credentials and secrets
- Insecure data validation
- Broken authentication mechanisms
- Excessive data exposure
- Lack of rate limiting
- Insecure direct object references
- Command injection vulnerabilities
- Broken access controls
- Insecure configuration settings

## Purpose

InsecureShip is designed as a simple tool to:

- Provide a hands-on environment for practicing secure development techniques
- Demonstrate typical vulnerabilities found in insecure applications in a direct manner
- Serve as a training tool for identifying and remediating common API security issues
- Help developers easily understand the impact of security misconfigurations and bad practices through clear examples

## Disclaimer

This application contains intentional security vulnerabilities and should never be deployed in production environments or exposed to the internet. Use only in controlled, isolated environments for security training, demonstrations, and testing.

## Writeup Walkthrough & Resolution

**File:** [`Walkthrough - Writeup.md`](./Walkthrough%20-%20Writeup.md)

The following analysis presents a **possible approach** to **identifying and mitigating** certain **vulnerabilities** observed in the application.  
It should **not** be interpreted as a **definitive guide** or an **official security recommendation**.  
Rather, it is intended as an **educational example** to encourage **reflection** on potential **mitigation strategies**.

It is important to note that **additional vulnerabilities** may exist beyond those discussed here, and that **other mitigation methods** not covered in this document may also be applicable.


## Technologies

- Node.js + Express
- MongoDB (without authentication, in Docker)

---

## Main Functionality

- User system with roles: `CUSTOMER`, `DRIVER`, `DISPATCHER`, `ADMIN`
- Package management (shipping, updating, assignment)
- Image processing from URL
- Remote command execution (RCE)
- Insecure JWT authentication

---

## InsecureShip – OWASP API Security Top 10 (2023) Coverage

This table maps intentionally insecure implementations in InsecureShip to the official OWASP API Security Top 10 risks for 2023.

| #  | Vulnerability Description                                                                 | OWASP API Risk | Official Name                                                                                          |
|----|--------------------------------------------------------------------------------------------|----------------|--------------------------------------------------------------------------------------------------------|
| 1  | User modifies their own `role` during registration or profile update                      | API3:2023      | Broken Object Property Level Authorization                                                            |
| 2  | Update other users without validating identity (`PUT /users/:username`)                   | API1:2023      | Broken Object Level Authorization                                                                      |
| 3  | Update any package without ownership check                                                | API1:2023      | Broken Object Level Authorization                                                                      |
| 4  | Promote users to new roles without privilege check (`POST /users/promote`)               | API5:2023      | Broken Function Level Authorization                                                                    |
| 5  | JWT tokens issued with long expiration time                                               | API8:2023      | Security Misconfiguration                                                                              |
| 6  | JWT signed using hardcoded secret                                                         | API2:2023      | Broken Authentication                                                                                  |
| 7  | Login endpoint lacks rate limiting                                                        | API4:2023      | Unrestricted Resource Consumption                                                                      |
| 8  | Regex pattern input causes ReDoS (`/search-tracking`)                                     | API4:2023      | Unrestricted Resource Consumption                                                                      |
| 9  | Fetching images via user-provided URLs without domain validation (`/images/fetch`)       | API7:2023      | Server Side Request Forgery                                                                            |
| 10 | Any user can create delivery packages without limitation or quota                         | API6:2023      | Unrestricted Access to Sensitive Business Flows                                                        |
| 11 | Any user can list all registered users                                                    | API5:2023      | Broken Function Level Authorization                                                                    |
| 12 | System commands can be executed via API (`/utils/exec`)                                   | API8:2023      | Security Misconfiguration                                                                              |
| 13 | CORS is enabled for all origins (`Access-Control-Allow-Origin: *`)                        | API8:2023      | Security Misconfiguration                                                                              |
| 14 | Old undocumented route for admin utilities (`/api/v0/utils`) is still active              | API9:2023      | Improper Inventory Management                                                                          |


## Summary by OWASP API Risk (2023)

| OWASP API Risk                                              | Covered      | Related Vulnerabilities               |
|-------------------------------------------------------------|--------------|--------------------------------------|
| API1:2023 – Broken Object Level Authorization               | ✅           | 2, 3                                 |
| API2:2023 – Broken Authentication                           | ✅           | 6                                    |
| API3:2023 – Broken Object Property Level Authorization      | ✅           | 1                                    |
| API4:2023 – Unrestricted Resource Consumption               | ✅           | 7, 8                                 |
| API5:2023 – Broken Function Level Authorization             | ✅           | 4, 10, 11                            |
| API6:2023 – Unrestricted Access to Sensitive Business Flows | ⚠️ Partial   | 10 (package creation with no limits) |
| API7:2023 – Server Side Request Forgery                     | ✅           | 9                                    |
| API8:2023 – Security Misconfiguration                       | ✅           | 5, 12, 13                            |
| API9:2023 – Improper Inventory Management                   | ✅           | 14                                   |
| API10:2023 – Unsafe Consumption of APIs                     | ❌           | Not yet implemented                  |



## Installation & Usage Guide – InsecureShip

InsecureShip is a deliberately vulnerable REST API built with Node.js and MongoDB (Dockerized) for learning about API security flaws, following the OWASP API Security Top 10 (2023). This guide will help you set it up and start exploring vulnerabilities step by step.

---

### Requirements

- **Node.js** (v22.8.0 or higher)
- **npm** (comes with Node)
- **Docker & Docker Compose**
- **Postman** (for testing endpoints)

---

### 1. Clone the Repository

```bash
git clone https://github.com/TheCyberpunker/InsecureShip.git
cd InsecureShip
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Start MongoDB (Dockerized)

Make sure Docker is running, then run:

```bash
sudo docker-compose up -d
```

This will spin up a local MongoDB instance on `mongodb://localhost:27017` with no authentication (intentionally insecure).

### 4. Start the Insecure API Server

```bash
node server.js
```

You should see:

```
📦 Connected to MongoDB (Docker)
🚀 Insecure API running at http://localhost:3000
```

### 5. Populate the Database with Sample Data (Optional)

To seed the MongoDB database with example users and packages:

```bash
node scripts/seed.js
```

### 6. Test the API with Postman

Import the following collection into Postman:
* `InsecureShip API.postman_collection.json`

This collection contains pre-configured requests to demonstrate each vulnerability.

### 7. Scan the Code for Known Vulnerabilities

You can use the included demo vulnerability scanner (`scripts/vulnchecker.js`) to detect insecure patterns.

```bash
npm run vulncheck
```

⚠️ This scanner is **for educational purposes only**. It simulates basic static analysis with regex. It is **not a real security tool**.

### 8. Optional: Secure Version

You can compare insecure and secure implementations to understand how to mitigate each issue. Look for clearly labeled corrected versions inside each route.

### Important Notes

* Do **NOT deploy** this app to any real or public environment.
* All vulnerabilities are **intentional** and marked clearly in code comments.
* Intended for use in **offline training labs**, workshops, and **security education**.

For a list of vulnerabilities covered, see the 📋 OWASP Coverage Table


## Ethical Warnings

- This project is only for training in controlled environments
- Should not be run in production
- Should never be publicly exposed
- Vulnerabilities are intentional

## Contact

Developed as an educational tool for API security training and ethical pentesting practices.

## Credits

Inspired by the OWASP API Top 10, with a focus on practical education about offensive and defensive security. Also inspired by other OpenSource projects like 


> This lab was originally created by **TheCyberpunker - Luis Uribe**, a security researcher from our company, who has kindly given us full permission to share his project.  
> Original repository: [TheCyberpunker/InsecureShip](https://github.com/TheCyberpunker/InsecureShip)


## 🙏 Open Source Inspiration & Thanks

This project was inspired and enriched by the work of the following open-source contributors and security communities:

- 🔗 [**Damn Vulnerable RESTaurant API Game**](https://github.com/theowni/Damn-Vulnerable-RESTaurant-API-Game)  
  *By [Krzysztof Pranczk (theowni)](https://github.com/theowni)* – A deliberately vulnerable Web API game designed for learning and hands-on training.

- 📋 [**Code Review Checklist**](https://github.com/mgreiler/code-review-checklist)  
  *By [Michaela Greiler (mgreiler)](https://github.com/mgreiler)* – A thoughtful and practical checklist to guide code review practices.

- 🔐 [**Secure Code Review Challenges**](https://github.com/dub-flow/secure-code-review-challenges)  
  *By [Florian Walter (dub-flow)](https://github.com/dub-flow)* – Real-world code samples with embedded security flaws for training and learning secure coding.

- 🛡️ [**OWASP API Security Project**](https://github.com/OWASP/API-Security)  
  Official resource: [owasp.org/www-project-api-security](https://owasp.org/www-project-api-security/) – The foundation for understanding and mitigating API-specific risks.

> ⚠️ We deeply appreciate the knowledge and tools shared by these communities. This project builds upon their ideas to promote practical and ethical security education.
