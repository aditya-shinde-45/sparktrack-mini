import supabase from '../Model/supabase.js';

// ===== 1. Get all externals =====
export const getAllExternals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('externals')
      .select('external_id, password, name');

    if (error) {
      console.error('Error fetching externals:', error);
      return res.status(500).json({ message: 'Error fetching externals.' });
    }

    res.json({ externals: data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};

// ===== 2. Update an external =====
export const updateExternal = async (req, res) => {
  try {
    const { external_id } = req.params;
    const { password, name } = req.body;

    if (!external_id) {
      return res.status(400).json({ message: 'External ID is required.' });
    }

    const updateData = {};
    if (password) updateData.password = password;
    if (name) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }

    const { data, error } = await supabase
      .from('externals')
      .update(updateData)
      .eq('external_id', external_id)
      .select();

    if (error) {
      console.error('Error updating external:', error);
      return res.status(500).json({ message: 'Error updating external.' });
    }

    res.json({ message: 'External updated successfully.', updated: data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};

// ===== 3. Get PBL data (flattened) =====
export const getPBLData = async (req, res) => {
  try {
    const classFilter = req.query.class?.toUpperCase(); // TY, SY, LY
    console.log("Received class filter:", classFilter);

    let query = supabase.from('pbl').select('*');

    if (classFilter) {
      console.log(`Filtering by class prefix: ${classFilter}`);
      query = query.ilike('class', `${classFilter}-%`);
    } else {
      console.log("No class filter provided, fetching all data.");
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching PBL data:', error);
      return res.status(500).json({ message: 'Error fetching PBL data.' });
    }


    res.json(data || []);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error occurred.' });
  }
};
