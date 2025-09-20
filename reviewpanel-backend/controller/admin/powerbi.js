import { PowerBIClient } from "@azure/powerbi-client";
import { ClientSecretCredential } from "@azure/identity";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const getPowerBIEmbedToken = async (req, res) => {
  try {
    const { reportId } = req.body;
    
    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "Report ID is required"
      });
    }
    
    // Check if all required environment variables are set
    if (!process.env.POWERBI_TENANT_ID || 
        !process.env.POWERBI_CLIENT_ID || 
        !process.env.POWERBI_CLIENT_SECRET || 
        !process.env.POWERBI_WORKSPACE_ID) {
      return res.status(500).json({
        success: false,
        message: "Power BI embedding is not configured properly. Check environment variables."
      });
    }
    
    // Create Azure AD credential
    const credential = new ClientSecretCredential(
      process.env.POWERBI_TENANT_ID,
      process.env.POWERBI_CLIENT_ID,
      process.env.POWERBI_CLIENT_SECRET
    );

    // Create Power BI client
    const powerbiClient = new PowerBIClient(credential);
    
    // Get report embedding URL
    const report = await powerbiClient.reports.getReport(
      process.env.POWERBI_WORKSPACE_ID,
      reportId
    );

    // Generate an embed token
    const embedTokenResponse = await powerbiClient.reports.generateToken(
      process.env.POWERBI_WORKSPACE_ID,
      reportId,
      {
        accessLevel: 'View'
      }
    );

    res.json({
      success: true,
      embedToken: embedTokenResponse.token,
      embedUrl: report.embedUrl,
      reportId: reportId,
      expiration: embedTokenResponse.expiration
    });
  } catch (error) {
    console.error('Power BI embed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate embed token',
      error: error.message
    });
  }
};