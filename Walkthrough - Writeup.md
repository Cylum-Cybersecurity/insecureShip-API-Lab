# Walkthrough - Writeup

**About the walkthrough/writeup**

The following analysis presents a **possible approach** to **identifying and mitigating** certain **vulnerabilities** observed in the application. It should **not** be interpreted as a **definitive guide** or an **official security recommendation**. Rather, it is intended as an **educational example** to encourage **reflection** on potential **mitigation strategies**.

It is important to note that **additional vulnerabilities** may exist beyond those discussed here, and that **other mitigation methods** not covered in this document may also be applicable.

- Run `vulnchecker` to identify the intentionally included vulnerabilities.
```shell
npm run vulncheck
```

Running `vulnchecker` will reveal that the application **intentionally contains 12 vulnerabilities** for demonstration purposes.

>You can also leverage **AI tools** to gain **additional context**, uncover **potential vulnerabilities**, or explore **alternative remediation strategies** for this **project**.
>Since the code is **deliberately vulnerable**, an AI system may be able to identify **insecure coding patterns** and suggest improvements or highlight security flaws that were intentionally introduced.

# Vulnerability 1 - Privilege Escalation

## Simple workaround

### Vulnerable code Snippet
file `routes/authRoutes.js`

```js
// Unsafe user registration

router.post('/register', async (req, res) => {

const { username, password, role } = req.body;
 
// The registration process lacks input validation and password encryption

const user = new User({ username, password, role });

await user.save();
res.status(201).json({ message: 'Usuario creado', user });

});
```

### Basic potential fix

```js
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hashedPassword, role: 'CUSTOMER' });
  await user.save();

  res.status(201).json({ message: 'Usuario registrado correctamente' });
});
```

- `const hashedPassword = await bcrypt.hash(password, 10); `10 refers to the **number of internal hashing rounds** applied by the algorithm.
- The **higher** the number, the **longer it takes to generate the hash** — making **brute-force attacks more expensive** for an attacker.    
- However, a higher value also means **greater CPU usage** on your side when **registering users** or **verifying passwords**.
### Moderate-level fix

```js
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Secure registration
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  // 1. Input validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // 2. Role validation (prevent direct ADMIN creation)
  const allowedRoles = ['CUSTOMER', 'DRIVER'];
  if (role && !allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Role not allowed during registration' });
  }

  // 3. Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create user securely
  const user = new User({ username, password: hashedPassword, role: role || 'CUSTOMER' });
  await user.save();

  // 5. Do not return the password in the response
  const userSafe = { id: user._id, username: user.username, role: user.role };
  res.status(201).json({ message: 'User created', user: userSafe });
});

```


# Vulnerability 2 – JWT Misconfiguration

## Simple workaround
### Vulnerable code Snippet

file `routes/authRoutes.js`

```js
const SECRET = ""
const token = jwt.sign(
  { id: user._id, username: user.username, role: user.role },
  SECRET, //  Hardcoded secret key
  { expiresIn: '7d' } //  Token expiration is too long
);
```

```
const SECRET = process.env.JWT_SECRET || 'insecuresecret';
```

file `.env`:

```js
JWT_SECRET=insecuresecret
```

**Issues:**

- It uses a **weak secret key** (`insecuresecret`), which is easy to guess or brute-force.
- The token has a **7-day expiration**, giving an attacker a wide window of opportunity to reuse a stolen token.
- It does not explicitly specify a **secure signing algorithm** like `HS256`, which can allow malicious use of `"alg": "none"` in the token header on misconfigured servers, potentially bypassing signature verification.

### How to exploit

#### Option 1: A stolen token remains valid for 7 days

Any token that is intercepted or leaked can be reused to access the API for a full week.  
An attacker could:

- Capture it if HTTPS is not enforced.
- Find it in logs, local storage, or poorly secured cookies.
- Steal it via an XSS attack accessing `localStorage`, `sessionStorage`, or cookies if they’re accessible to JavaScript.

### Basic potential fix

```js
const token = jwt.sign(
  { id: user._id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  {
    algorithm: 'HS256',
    expiresIn: '15m' // shorter token lifetime
  }
);

```


- Tokens stored in _localStorage_ should have _short expiration times_ (e.g., _15–30 minutes of inactivity timeout, 8-hour absolute timeout_).
- Implement mechanisms like _token rotation_ and _refresh tokens_ to reduce exposure risk.
- Explicit use of a strong algorithm (`HS256`)
- Short expiration reduces the window of token abuse
- A long, random, and non-guessable secret key improves cryptographic security

Reference: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html


# Vulnerability 3 - Rate Limit

## Simple workaround
### Vulnerable code Snippet

Although this is a working example for the `/login` endpoint, **similar protections may be missing in other routes** of the application.

Additionally, this endpoint **lacks any kind of rate limiting**, which makes it vulnerable to **brute-force or credential stuffing attacks**. Without a mechanism to detect and block repeated failed login attempts, an attacker can automate requests to guess valid credentials.

file `routes/authRoutes.js`

```js
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m'
    }
  );
  res.json({ message: "Login successful", token });
});

```

### Basic potential fix

Implement **rate limiting** and/or **account lockout mechanisms** to prevent abuse of authentication endpoints. Middleware like `express-rate-limit` can help restrict the number of attempts per IP or user in a given timeframe.

```js
const rateLimit = require("express-rate-limit");
const User = require("../models/User");

// Apply rate limiting to login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per window
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});


router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m'
    }
  );
  res.json({ message: "Login successful", token });
});

module.exports = router;
```
# Vulnerability 4 - Redos

## Simple workaround

An attacker can send specially crafted input to **trigger excessive CPU consumption**, resulting in a **ReDoS (Regular Expression Denial of Service)**.

### Vulnerable code Snippet

```
/^((a+))+$/
```


```js
  
router.post('/search-tracking', verifyToken, async (req, res) => {
  const { pattern } = req.body;

  try {
    const regex = new RegExp(`^(${pattern})+$`); // Nested regex, vulnerable to backtracking (ReDoS)

    const allPackages = await Package.find();
    console.time("match");
    const matches = allPackages.filter(pkg => regex.test(pkg.trackingNumber));
    console.timeEnd("match");

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Invalid pattern or internal error', details: err.message });
  }
});

```

- the endpoint accepts **user-controlled regex input** and applies it directly without any validation or sanitization.
- It constructs a **nested regex pattern** using `+` and grouping, which is highly susceptible to **catastrophic backtracking**.


### How to exploit

- create a package with `aaaaaaaaaaaaaaaaaaaaaaaaaaa`
- then search the package with `a+`

Or an attacker could craft a pattern like:

```js
{ "pattern": "(a+)+" }
```

### Basic potential fix

This version protects against ReDoS while preserving core functionality:

- Limits the input size
- Escapes user input to avoid malicious regex
- Maintains pattern-based search capability

```js
//just replace
const regex = new RegExp(`^(${pattern.replace(/[();]/g, '')})+$`);
const regex = new RegExp(`^(${pattern.replace(/[();]/g, '')})$`);
```

```js
/**
 * Secure version of the package search route.
 * Prevents ReDoS by escaping user input and avoiding nested regex patterns.
 */

const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const { verifyToken } = require('../middlewares/authMiddleware');

// Escape function to neutralize special regex characters
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.post('/search-tracking', verifyToken, async (req, res) => {
  const { pattern } = req.body;

  // Validate the pattern length
  if (!pattern || pattern.length > 30) {
    return res.status(400).json({ error: 'Invalid or too long pattern' });
  }

  try {
    //  Safe regex: escaped user input, no grouping or nested quantifiers
    const safePattern = escapeRegExp(pattern);
    const regex = new RegExp(`^${safePattern}$`, 'i'); // match exact tracking numbers

    const allPackages = await Package.find();
    console.time("match");
    const matches = allPackages.filter(pkg => regex.test(pkg.trackingNumber));
    console.timeEnd("match");

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

module.exports = router;
```

| Protection            | Explanation                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `escapeRegExp`        | Converts user input into a literal string, eliminating regex execution risks    |
| `pattern.length > 30` | Prevents abuse via oversized input that could trigger performance issues        |
| `^${...}$`            | Matches the full tracking number exactly, avoiding nested or ambiguous patterns |

# Vulnerability 5 – SSRF (Server-Side Request Forgery)

## Simple workaround
### Vulnerable code Snippet

**File:** `routes/imageRoutes.js`

```js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/fetch', verifyToken, async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'];

    res.json({ contentType, base64 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to download image', details: err.message });
  }
});
```

- Accepts **arbitrary URLs** from any authenticated user.
- The backend performs HTTP requests **without validating the domain or file type**.
- An attacker could exploit this to:
    - Access internal services (`localhost`, `127.0.0.1`)
    - Perform internal port scanning
    - Extract cloud metadata (e.g., `169.254.169.254`)

### How to exploit

```sh
curl -X POST http://localhost:3000/api/images/fetch \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "http://127.0.0.1:27017"}'
```

```sh
{
  "contentType": "text/plain",
  "base64": "SXQgbG9va3MgbGlrZSB5b3UgYXJlIHRyeWluZyB0byBhY2Nlc3MgTW9uZ29EQg=="
}
```
### Basic potential fix

```js
const allowedHosts = ['upload.wikimedia.org', 'cdn.example.com'];

router.post('/fetch', verifyToken, async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const urlObj = new URL(imageUrl);
    if (!allowedHosts.includes(urlObj.hostname)) {
      return res.status(400).json({ error: 'URL not allowed' });
    }

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'];

    res.json({ contentType, base64 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to download image', details: err.message });
  }
});
```
### Moderate-level fix

```js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const { verifyToken } = require('../middlewares/authMiddleware');

const allowedHosts = ['upload.wikimedia.org', 'cdn.example.com'];
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

router.post('/fetch', verifyToken, async (req, res) => {
  const { imageUrl } = req.body;

  try {
    const urlObj = new URL(imageUrl);

    // Validate domain
    if (!allowedHosts.includes(urlObj.hostname)) {
      return res.status(400).json({ error: 'URL not allowed' });
    }

    // Validate file extension
    const ext = path.extname(urlObj.pathname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: 'File extension not allowed' });
    }

    // Download content
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    // Validate MIME type
    const contentType = response.headers['content-type'];
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to a valid image' });
    }

    // Encode image to base64
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    res.json({ contentType, base64 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to download image', details: err.message });
  }
});

```

- Requires the image URL to match a **pre-approved list of domains** (`allowedHosts`)
    
- Only allows **known image file extensions**
    
- Checks that the MIME type actually starts with `image/` to avoid misclassified content


# Vulnerability 6 – Broken Access Control (1)

## Simple workaround

### Vulnerable code Snippet

**File:** `routes/packageRoutes.js`

```js
router.post('/create', verifyToken, async (req, res) => {
  const newPackage = new Package(req.body);
  await newPackage.save();
  res.json({ message: 'Package created', newPackage });
});
```

- Allows **any authenticated user** to create a package.    
- Does **not check the user’s role** (e.g., should only allow `CUSTOMER`).    
- This opens the door to abuse scenarios such as:    
    - `DRIVER` or `DISPATCHER` roles creating arbitrary packages        
    - Users submitting **fake shipments** or tampering with logistics flow

### How to exploit

Log in as a `DRIVER`, for example user `daniela`, and run:

```sh
curl -X POST http://localhost:3000/api/packages/create \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "PKG999",
    "sender": "maria",
    "recipient": "lucas",
    "address": "Hacked St",
    "status": "PENDING"
  }'
```

This request will be accepted, even though the role is not authorized to create packages.

### Basic potential fix

```js
router.post('/create', verifyToken, async (req, res) => {
  // Only CUSTOMERS are allowed to create packages
  if (req.user.role !== 'CUSTOMER') {
    return res.status(403).json({ error: 'Only customers are allowed to create packages' });
  }

  const newPackage = new Package(req.body);
  await newPackage.save();
  res.json({ message: 'Package created', newPackage });
});

```


### Moderate-level fix



# Vulnerability 7 – Broken Access Control (2)

## Simple workaround

### Vulnerable code Snippet

**File:** `routes/userRoutes.js`

```js
router.get('/all', verifyToken, async (req, res) => {
  const users = await User.find();
  res.json(users);
});
```

Any authenticated user with a valid token — even a regular `CUSTOMER` — can access the **entire list of users** in the system.

### How to exploit

- Using Postman or `curl`

1. Log in as a normal user (`CUSTOMER`) to obtain a token.
2. Then send the following request:

```sh
curl http://localhost:3000/api/users/all \ 
-H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
```

This will return a full list of users, including sensitive fields if not properly filtered.

### Basic potential fix

```js
router.get('/all', verifyToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const users = await User.find();
  res.json(users);
});

```

- The updated route adds a **role check** to restrict access to `ADMIN` users only.  
- Even with a valid JWT, non-admin users will be blocked from accessing the endpoint.
### Moderate-level fix



# Vulnerability 8 – Broken Access Control (3)

## Simple workaround

### Vulnerable code Snippet

**File:** `routes/userRoutes.js`

```js
router.put('/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  const update = req.body;

  const user = await User.findOneAndUpdate({ username }, update, { new: true });
  res.json(user);
});

```

- Allows **any authenticated user** to edit **any other user's account**, simply by knowing their `username`.
- Does not check whether the user is modifying **their own account** or someone else’s.
- This opens the door to several types of abuse:
    - Changing **another user’s password**
    - Making **unauthorized updates** to someone else’s profile

### How to exploit

1. Log in as a regular `CUSTOMER` user, e.g., `lucas`
2. Using Postman or `curl`, send a request to update another user:

Even though `lucas` is logged in, he can change the password of `maria`, which should not be allowed.

### Basic potential fix

```js
router.put('/:username', verifyToken, async (req, res) => {
  const { username } = req.params;

  // Only allow users to edit their own accounts
  if (req.user.username !== username) {
    return res.status(403).json({ error: 'You can only edit your own user account' });
  }

  const update = req.body;
  const user = await User.findOneAndUpdate({ username }, update, { new: true });
  res.json(user);
});
```

This version enforces a strict check to ensure that users can **only update their own data**, based on the username in the JWT payload.  
It prevents unauthorized edits across different user accounts, reducing the risk of privilege escalation or data tampering.

### Moderate-level fix


# Vulnerability 9 – Privilege Escalation

## Simple workaround

### Vulnerable code Snippet

**File:** `routes/userRoutes.js`

```js
router.post('/promote', verifyToken, async (req, res) => {
  const { username, role } = req.body;

  const user = await User.findOneAndUpdate({ username }, { role }, { new: true });
  res.json({ message: 'Role updated', user });
});

```

- Allows **any authenticated user** to change **any other user's role**.
- Does **not validate whether the requester has the right to perform the action**.
- A regular `CUSTOMER` could escalate privileges and become an `ADMIN`, `DRIVER`, etc.
### How to exploit

1. Log in as a low-privilege user (e.g., `lucas`).
2. Run the following command:
```sh
curl -X POST http://localhost:3000/api/users/promote \
  -H "Authorization: Bearer LUCAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "lucas", "role": "ADMIN"}'
```

This would promote `lucas` to `ADMIN` — without proper authorization.

### Basic potential fix

```js
router.post('/promote', verifyToken, async (req, res) => {
  // Only an ADMIN can promote users
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: only an ADMIN can change roles' });
  }

  const { username, role } = req.body;
  const user = await User.findOneAndUpdate({ username }, { role }, { new: true });
  res.json({ message: 'Role updated', user });
});

```

This version introduces a **role check** to ensure that only users with the `ADMIN` role are authorized to promote others.  
It prevents privilege escalation by unauthorized users and ensures role changes are properly controlled.

### Moderate-level fix


# Vulnerability 10 – Remote Code Execution (RCE)

## Simple workaround

### Vulnerable code Snippet

**File:** `routes/utilsRoutes.js`

```js
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/exec', verifyToken, (req, res) => {
  const { command } = req.body;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(400).json({ stderr });
    }
    res.json({ output: stdout });
  });
});

```

- Directly executes system commands using `child_process.exec()`.
- Does **not check which users** are allowed to access the endpoint.
- Does **not validate the command input**.
- Any authenticated user can run:
    - `ls`, `cat /etc/passwd`, `rm -rf`, etc.
    - **Chained commands** like `whoami && uptime`.
### How to exploit

- Log in as a normal user.
- Execute:

```sh
curl -X POST http://localhost:3000/api/utils/exec \
  -H "Authorization: Bearer VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "cat /etc/passwd"}'

```

This command will be executed on the server, exposing sensitive system information.

### Basic potential fix

- Basic version using an allowlist - **warning** (just for testing, this must no be used in the real world)

```js
const allowedCommands = ['uptime', 'whoami', 'df -h'];

router.post('/exec', verifyToken, (req, res) => {
  const { command } = req.body;

  // Allow only specific commands
  if (!allowedCommands.includes(command)) {
    return res.status(400).json({ error: 'Command not allowed' });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(400).json({ stderr });
    }
    res.json({ output: stdout });
  });
});

```

### Moderate-level fix

- Safer version using `execFile` and command mapping:

```js
const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const { verifyToken } = require('../middlewares/authMiddleware');

// Command mapping (logical name → binary + args)
const safeCommands = {
  uptime: ['uptime'],
  whoami: ['whoami'],
  disk: ['df', '-h']
};

router.post('/exec', verifyToken, (req, res) => {
  const { command } = req.body;

  if (!safeCommands[command]) {
    return res.status(400).json({ error: 'Command not allowed' });
  }

  const [cmd, ...args] = safeCommands[command];

  execFile(cmd, args, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(400).json({ stderr });
    }
    res.json({ output: stdout });
  });
});

```

- The updated code uses a **command allowlist**, restricting execution to a predefined set of safe operations.  
- It completely eliminates arbitrary input execution, thus blocking all Remote Command Execution (RCE) vectors.

### Important Warning (Security Best Practice)

Although the mitigated versions above reduce the risk of arbitrary command execution, **they are intended for educational purposes only**.

> **Direct execution of system-level commands from a web API is inherently dangerous** and should be avoided in production environments.

Even with a strict allowlist, improper use of `exec`, `execFile`, or similar functions can still:
- Expose the system to privilege escalation, command injection, or chaining techniques.
- Allow lateral movement if combined with other vulnerabilities.
- Be abused if authorization and input auditing are not enforced.

# Vulnerability 11 – CORS Misconfiguration

## Simple workaround


### Vulnerable code Snippet

**File:** `server.js`

```js
const cors = require('cors');
app.use(cors());
```

- Using `cors()` without configuration **allows all origins** to access your API.
- The backend responds with: `Access-Control-Allow-Origin: *`

- This means **any external website**, including a malicious one, can make requests to your API.
- If an attacker obtains a user's JWT, they can easily **exfiltrate sensitive data** from the API using a forged frontend.

### How to exploit

- create an example file: cors-exploit.html

```html
<!DOCTYPE html>
<html>
<body>
  <h1>CORS Attack</h1>
  <script>
    fetch("http://localhost:3000/api/users/all", {
      headers: {
        "Authorization": "Bearer YOUR_VALID_TOKEN"
      }
    })
    .then(res => res.text())
    .then(data => alert("Stolen data:\n" + data));
  </script>
</body>
</html>

```

Or via the browser console:

```js
fetch('http://localhost:3000/api/users/all', {
  headers: {
    Authorization: 'Bearer YOUR_TOKEN'
  }
}).then(res => res.text()).then(console.log).catch(console.error);

```

If CORS is misconfigured, this request will succeed and display server data from an **unauthorized origin**.

### Basic potential fix

```js
app.use(cors({
  origin: ['http://localhost:3001'], //  only allow the authorized frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

```

The corrected configuration **explicitly restricts allowed origins**, methods, and headers.  
Only trusted frontends (like your official React/Vue/Next.js app) can interact with the API, mitigating **Cross-Origin Resource Sharing (CORS)** abuse.

### Optional Security Tip

If your API only serves requests from a single domain, **never use wildcard CORS (`*`)** — not even in development — unless you're sure no sensitive data or credentials are exposed.

### Moderate-level fix


## Vulnerability 12 – StackTrace


