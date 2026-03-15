# Job Application Tracker

A web application to track job applications.

## Features

- Add new job applications  
- Edit and update applications  
- Delete applications  
- Dashboard with application statistics  
- Search and filter applications  
- Status distribution chart  
- Company name autocomplete suggestions  
- Keyboard navigation for suggestions  
- Loading animation for form submission  


## Tech Stack

- Frontend: HTML, CSS, JavaScript  
- Backend: Node.js + Express  
- Database: PostgreSQL  
- Charts: Chart.js  
- Date Picker: Flatpickr

## Autocomplete Design

While implementing the company name autocomplete feature, I considered multiple approaches.

### 1. Static List (companies.js)

Company names can be stored in a JavaScript file and filtered on the frontend.

**Pros**
- Simple implementation
- No backend calls

**Cons**
- Not scalable
- Requires manual updates

---

### 2. Database Autocomplete (Chosen Approach)

Company names are stored in PostgreSQL and suggestions are fetched through a Node.js + Express API.

Example query:

SELECT name
FROM companies
WHERE name ILIKE 'goo%'
LIMIT 10;

**Pros**
- Scalable solution
- Uses backend + database architecture
- Faster search using database indexing

---

### 3. Trie-Based Autocomplete

A Trie (prefix tree) can also be used to store company names and perform prefix searches efficiently.

**Pros**
- Very fast prefix searching

**Cons**
- More complex implementation
- Not necessary for this project

---
### 4. Hashing-Based Autocomplete

Another approach considered was using a hash map to group companies by the first letter.

Example structure:

g → [Google, GoDaddy, Goldman Sachs]  
a → [Amazon, Apple]  
m → [Microsoft, Meta, Micron]

When the user types a prefix like `mic`, the system first accesses the bucket `m` in constant time and then filters companies inside that bucket.

**Time Complexity**

O(1) + O(k)

Where:
- `O(1)` → accessing the bucket
- `k` → number of companies inside that bucket

**Why it was not chosen**

Although hashing provides fast bucket access, it requires loading the entire dataset into browser memory. For large datasets (e.g., tens of thousands of companies), this increases frontend memory usage and slows down the application. A PostgreSQL-based approach keeps data in the database and returns only the required suggestions, making it more scalable.

### Final Decision

I chose PostgreSQL-based autocomplete because it integrates well with the backend and provides a scalable architecture for this project.