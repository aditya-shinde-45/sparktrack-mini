// controllers/externalController.js
import supabase from '../Model/supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'; // Use .env in production

// ===== 1. External Login =====
export const externalLogin = async (req, res) => {
  try {
    const { external_id, password } = req.body;

    if (!external_id || !password) {
      return res.status(400).json({ message: 'External ID and password are required.' });
    }

    // Fetch external user
    const { data, error } = await supabase
      .from('externals')
      .select('external_id, contact, name, email, class, year')
      .eq('external_id', external_id)
      .single();

    if (error || !data) {
      return res.status(401).json({ message: 'Invalid external ID or password.' });
    }

    // Check password
    if (data.contact !== password) {
      return res.status(401).json({ message: 'Invalid external ID or password.' });
    }

    // JWT payload
    const payload = {
      external_id: data.external_id,
      name: data.name,
      email: data.email,
      class: data.class,
      year: data.year,
      role: 'External',
    };

    // Sign token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: 'Login successful', token, user: payload });
  } catch (error) {
    console.error('External login error:', error);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};

// ===== 2. Get Assigned Groups =====
export const getAssignedGroups = async (req, res) => {
  try {
    const { class: className } = req.user; // Comes from middleware after JWT verification

    if (!className) {
      return res.status(400).json({ message: 'Class information missing in token.' });
    }

    // Fetch matching groups from pbl table
    const { data: groups, error } = await supabase
      .from('pbl')
      .select('group_id')
      .like('group_id', `${className}%`);

    if (error) {
      console.error('Error fetching groups:', error);
      return res.status(500).json({ message: 'Error fetching groups.' });
    }

    const groupList = groups.map(g => g.group_id);

    res.json({ class: className, groups: groupList });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};
