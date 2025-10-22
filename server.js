import express from 'express'
import cors from 'cors'
import { palindromeChecker } from './palindrome.js'
import crypto from "crypto"
import { space } from './wordCount.js'
import { uniqueCharCount } from './uniqueChar.js'
import { letterFrequency } from './charFrequency.js'
import { error } from 'console'

const app = express()

app.use(cors())
app.use(express.json())

const database = {}

app.post('/strings', async (req, res) => {
    const data = req.body
    const input = Object.values(data)[0]
    const len = input.length
    const hash = crypto.createHash("sha256").update(input).digest('hex')
    // const {value} = req.body

    if (input === undefined) {
        return res.status(400).json({ error: 'Missing "input" field' })
    }
    if (typeof input !== 'string') {
        return res.status(422).json({ error: '"input" must be a string' })
    }

    if (database[hash]) {
        return res.status(409).json({error: "String already exists in the system"})
    }

    const result = {
        id: hash, 
        value: input,
        properties: {
            length: len,
            is_palindrome: palindromeChecker(input),
            unique_characters: uniqueCharCount(input),
            word_count: space(input),
            sha256_hash: hash,
            character_frequency_map: letterFrequency(input),
        },
        created_at: new Date().toISOString()
    }
    database[hash] = result
    return res.status(201).json(result)
    
})


app.get('/strings/:string_value', (req, res) => {
    const { string_value } = req.params
    const hash = crypto.createHash('sha256').update(string_value).digest('hex')

    const record = database[hash]
    if (!record) {
        return res.status(404).json({ error: 'String does not exist in the system' })
    }

    return res.status(200).json(record)
})


app.get('/strings', (req, res) => {
  try {
    const {
      is_palindrome,
      min_length,
      max_length,
      word_count,
      contains_character
    } = req.query;

    // Convert query parameters to correct types
    const filters = {};

    if (is_palindrome !== undefined) {
      if (is_palindrome !== "true" && is_palindrome !== "false") {
        return res.status(400).json({ error: 'is_palindrome must be "true" or "false"' });
      }
      filters.is_palindrome = is_palindrome === "true";
    }

    if (min_length !== undefined) {
      const val = parseInt(min_length);
      if (isNaN(val)) return res.status(400).json({ error: 'min_length must be an integer' });
      filters.min_length = val;
    }

    if (max_length !== undefined) {
      const val = parseInt(max_length);
      if (isNaN(val)) return res.status(400).json({ error: 'max_length must be an integer' });
      filters.max_length = val;
    }

    if (word_count !== undefined) {
      const val = parseInt(word_count);
      if (isNaN(val)) return res.status(400).json({ error: 'word_count must be an integer' });
      filters.word_count = val;
    }

    if (contains_character !== undefined) {
      if (typeof contains_character !== "string" || contains_character.length !== 1) {
        return res.status(400).json({ error: 'contains_character must be a single character' });
      }
      filters.contains_character = contains_character.toLowerCase();
    }

    // Now apply filters
    const allStrings = Object.values(database);
    const filtered = allStrings.filter(entry => {
      const p = entry.properties;

      if (filters.is_palindrome !== undefined && p.is_palindrome !== filters.is_palindrome)
        return false;
      if (filters.min_length !== undefined && p.length < filters.min_length)
        return false;
      if (filters.max_length !== undefined && p.length > filters.max_length)
        return false;
      if (filters.word_count !== undefined && p.word_count !== filters.word_count)
        return false;
      if (filters.contains_character !== undefined && !entry.value.toLowerCase().includes(filters.contains_character))
        return false;

      return true;
    });

    res.status(200).json({
      data: filtered,
      count: filtered.length,
      filters_applied: filters
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get('/strings/filter-by-natural-language', (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    const q = query.toLowerCase();
    const parsed_filters = {};

    // Rule-based parsing
    if (q.includes("palindromic")) parsed_filters.is_palindrome = true;
    if (q.includes("single word")) parsed_filters.word_count = 1;
    if (q.includes("longer than")) {
      const match = q.match(/longer than (\d+)/);
      if (match) parsed_filters.min_length = parseInt(match[1]) + 1;
    }
    if (q.includes("containing the letter")) {
      const match = q.match(/containing the letter ([a-z])/);
      if (match) parsed_filters.contains_character = match[1];
    }
    if (q.includes("containing the first vowel")) {
      parsed_filters.contains_character = "a";
    }

    // If we couldn’t detect any filters, reject
    if (Object.keys(parsed_filters).length === 0) {
      return res.status(400).json({ error: "Unable to parse natural language query" });
    }

    // Apply filters (reuse same logic from before)
    const allStrings = Object.values(database);
    const filtered = allStrings.filter(entry => {
      const p = entry.properties;

      if (parsed_filters.is_palindrome !== undefined && p.is_palindrome !== parsed_filters.is_palindrome)
        return false;
      if (parsed_filters.min_length !== undefined && p.length < parsed_filters.min_length)
        return false;
      if (parsed_filters.word_count !== undefined && p.word_count !== parsed_filters.word_count)
        return false;
      if (parsed_filters.contains_character !== undefined && !entry.value.toLowerCase().includes(parsed_filters.contains_character))
        return false;

      return true;
    });

    res.status(200).json({
      data: filtered,
      count: filtered.length,
      interpreted_query: {
        original: query,
        parsed_filters
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.delete('/strings/:string_value', (req, res) => {
  const { string_value } = req.params;
  const hash = crypto.createHash('sha256').update(string_value).digest('hex');

  if (!database[hash]) {
    return res.status(404).json({ error: 'String does not exist in the system' });
  }

  delete database[hash];
  return res.status(204).send(); // No content
});


app.get('/', (req, res) => {
  res.send('🚀 String Analysis API is running!');
});


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀Server is running at http://localhost:${PORT}`)
})


// console.log(Object.keys(data))
// console.log(Object.values(data)[0])
// console.log(data)