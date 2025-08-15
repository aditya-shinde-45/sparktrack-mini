import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import supabase from '../Model/supabase.js';

const uploadSIH = async (req, res) => {
  const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,   
      defval: ''  
    });

    const [rawHeaders, ...rows] = sheetData;

    if (!rawHeaders || rows.length === 0) {
      return res.status(400).send('No data found in uploaded file');
    }

    const headers = rawHeaders.map(h =>
      h?.toString().trim().toLowerCase().replace(/\s+/g, '_')
    );

    const parsed = rows.map(row =>
      Object.fromEntries(row.map((value, index) => [headers[index], value]))
    );

    const formatted = parsed.map((row) => ({
      statement_id: (row['statement_id'] || '').toString().substring(0, 50),
      title: (row['title'] || '').toString().substring(0, 500),
      category: (row['category'] || '').toString().substring(0, 500),
      technology_bucket: (row['technology_bucket'] || '').toString().substring(0, 500),
      description: (row['description'] || '').toString(),
      department: (row['department'] || '').toString().substring(0, 500),
      organisation: (row['organisation'] || '').toString().substring(0, 500),
      datasetfile: (row['datasetfile'] || '').toString().substring(0, 500)
    }));

    // Insert into Supabase
    const { error } = await supabase
      .from('sih_problems')
      .upsert(formatted, { onConflict: 'statement_id' });

    if (error) throw error;

    fs.unlinkSync(filePath); // Clean up uploaded file
    res.status(200).json({ message: 'SIH Problem Statements uploaded successfully' });
  } catch (error) {
    console.error('Error processing SIH XLSX file:', error);
    res.status(500).json({ error: 'Failed to upload SIH Problem Statements' });
  }
};

const getSIHProblems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sih_problems')
      .select('statement_id, title, category, technology_bucket, description, department');

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching SIH problem statements:', error);
    res.status(500).json({ error: 'Failed to fetch SIH problem statements' });
  }
};

export { uploadSIH, getSIHProblems };