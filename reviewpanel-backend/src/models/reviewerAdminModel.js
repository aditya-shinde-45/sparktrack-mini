import { supabase } from '../config/database.js';

class ReviewerAdminModel {
  /**
   * Reset all PBL2 marks for a specific group
   */
  async resetPbl2Marks(groupId) {
    try {
      console.log('Resetting PBL2 marks for group:', groupId);
      const { data, error } = await supabase
        .from('pbl2')
        .update({
          m1: null,
          m2: null,
          m3: null,
          m4: null,
          m5: null,
          m6: null,
          m7: null,
          total: null,
          ig: null,
          feedback: null,
          external1: null,
          external2: null,
          ext1_org: null,
          ext2_org: null,
          ext1_contact: null,
          ext1_email: null,
          ext2_contact: null,
          ext2_email: null
        })
        .eq('group_id', groupId)
        .select();

      console.log('PBL2 reset result:', { data, error });
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      return {
        message: `All PBL2 marks reset for group ${groupId}`,
        affectedRows: data?.length || 0
      };
    } catch (error) {
      console.error('Error resetting PBL2 marks:', error);
      throw error;
    }
  }

  /**
   * Reset all PBL3 marks for a specific group
   */
  async resetPbl3Marks(groupId) {
    try {
      console.log('Resetting PBL3 marks for group:', groupId);
      const { data, error } = await supabase
        .from('pbl3')
        .update({
          m1: null,
          m2: null,
          m3: null,
          m4: null,
          m5: null,
          m6: null,
          m7: null,
          total: null,
          ig: null,
          feedback: null,
          external1_name: null,
          external2_name: null,
          external1_org: null,
          external2_org: null,
          external1_contact: null,
          external1_email: null,
          external2_contact: null,
          external2_email: null,
          external1_phone: null,
          external2_phone: null,
          external1_m1: null,
          external1_m2: null,
          external1_m3: null,
          external1_m4: null,
          external1_m5: null,
          external1_m6: null,
          external2_m1: null,
          external2_m2: null,
          external2_m3: null,
          external2_m4: null,
          external2_m5: null,
          external2_m6: null
        })
        .eq('group_id', groupId)
        .select();

      console.log('PBL3 reset result:', { data, error });
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      return {
        message: `All PBL3 marks reset for group ${groupId}`,
        affectedRows: data?.length || 0
      };
    } catch (error) {
      console.error('Error resetting PBL3 marks:', error);
      throw error;
    }
  }

  /**
   * Update individual student PBL2 marks
   */
  async updatePbl2Marks(groupId, studentId, marks) {
    try {
      const { data, error} = await supabase
        .from('pbl2')
        .update(marks)
        .eq('group_id', groupId)
        .eq('enrollement_no', studentId);

      if (error) throw error;

      return {
        message: 'PBL2 marks updated successfully',
        data
      };
    } catch (error) {
      console.error('Error updating PBL2 marks:', error);
      throw error;
    }
  }

  /**
   * Update individual student PBL3 marks
   */
  async updatePbl3Marks(groupId, studentId, marks) {
    try {
      const { data, error } = await supabase
        .from('pbl3')
        .update(marks)
        .eq('group_id', groupId)
        .eq('enrollement_no', studentId);

      if (error) throw error;

      return {
        message: 'PBL3 marks updated successfully',
        data
      };
    } catch (error) {
      console.error('Error updating PBL3 marks:', error);
      throw error;
    }
  }

  /**
   * Get all unique groups from both pbl2 and pbl3 tables
   */
  async getAllGroups() {
    try {
      // Get groups from pbl2
      const { data: pbl2Groups, error: pbl2Error } = await supabase
        .from('pbl2')
        .select('group_id')
        .order('group_id');

      if (pbl2Error) throw pbl2Error;

      // Get groups from pbl3
      const { data: pbl3Groups, error: pbl3Error } = await supabase
        .from('pbl3')
        .select('group_id')
        .order('group_id');

      if (pbl3Error) throw pbl3Error;

      // Combine and get unique groups
      const allGroups = [
        ...new Set([
          ...pbl2Groups.map(g => g.group_id),
          ...pbl3Groups.map(g => g.group_id)
        ])
      ].sort();

      return allGroups;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  /**
   * Get PBL2 evaluation data for a specific group
   */
  async getPbl2Evaluation(groupId) {
    try {
      console.log('Fetching PBL2 evaluation for group:', groupId);
      const { data, error } = await supabase
        .from('pbl2')
        .select('*')
        .eq('group_id', groupId);

      console.log('PBL2 query result:', { data, error });
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching PBL2 evaluation:', error);
      throw error;
    }
  }

  /**
   * Get PBL3 evaluation data for a specific group
   */
  async getPbl3Evaluation(groupId) {
    try {
      console.log('Fetching PBL3 evaluation for group:', groupId);
      const { data, error } = await supabase
        .from('pbl3')
        .select('*')
        .eq('group_id', groupId);

      console.log('PBL3 query result:', { data, error });
      
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching PBL3 evaluation:', error);
      throw error;
    }
  }
}

export default new ReviewerAdminModel();
