import supabase from "../../Model/supabase.js";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'; // Use .env in production

export const externalLogin = async (req, res) => {
  try {
    const { external_id, password } = req.body;

    if (!external_id || !password) {
      return res.status(400).json({ message: 'External ID and password are required.' });
    }

    // Fetch the user from externals table including name
    const { data, error } = await supabase
      .from('externals')
      .select('external_id, password, name')  // include name here
      .eq('external_id', external_id)
      .single();

    if (error || !data) {
      console.log('Supabase error:', error);
      return res.status(401).json({ message: 'Invalid external ID or password.' });
    }

    // Compare passwords exactly
    if (data.password !== password) {
      return res.status(401).json({ message: 'Invalid external ID or password.' });
    }

    // JWT payload
    const payload = {
      external_id: data.external_id,
      role: 'External',
      name: data.name, // include name in token
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ 
      message: 'Login successful', 
      token, 
      user: { external_id: data.external_id, name: data.name, role: 'External' } 
    });
  } catch (err) {
    console.error('External login error:', err);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};

export const getAssignedGroups = async (req, res) => {
  try {
    const { external_id } = req.user; // Comes from JWT after login

    if (!external_id) {
      return res.status(400).json({ message: 'External ID missing in token.' });
    }

    // Fetch matching groups from pbl table where group_id contains external_id
    const { data: groups, error } = await supabase
      .from('pbl')
      .select('group_id')
      .like('group_id', `${external_id}%`); // use external_id instead of className

    if (error) {
      console.error('Error fetching groups:', error);
      return res.status(500).json({ message: 'Error fetching groups.' });
    }

    const groupList = groups.map(g => g.group_id);

    res.json({ external_id, groups: groupList });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};
