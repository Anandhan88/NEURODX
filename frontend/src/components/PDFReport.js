import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, FileText, User, Activity } from 'lucide-react';
import './PDFReport.css';

const PDFReport = ({ result, chartsRef, patientName, patientId, patientAge, doctorNotes }) => {
  const generatePDF = async (detailed = false) => {
    if (!result) {
      alert('No analysis results available for PDF generation.');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const { class: label, confidence } = result;

      let currentY = 15;

      // 1. Header Section
      pdf.setFillColor(15, 76, 129); // Deep Medical Blue
      pdf.rect(0, 0, 210, 40, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text('NEURODX AI CLINICAL REPORT', 20, 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(200, 220, 240);
      pdf.text('Automated Brain Tumor MRI Classification & Diagnostic Report', 20, 28);
      pdf.text(`Clinical Platform Lead Authorizer Node`, 20, 34);

      currentY = 52;

      // 2. Patient & Metadata Grid
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('1. Patient & Observation Data', 20, currentY);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, currentY + 2, 190, currentY + 2);
      
      currentY += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);

      pdf.text(`Patient Full Name:  ${patientName || 'Anonymous Patient'}`, 20, currentY);
      pdf.text(`Medical Record ID:  ${patientId || 'MR-N/A'}`, 110, currentY);
      currentY += 7;
      pdf.text(`Patient Age:             ${patientAge || 'N/A'}`, 20, currentY);
      pdf.text(`Imaging Modality:    MRI (T1-Weighted Contrast)`, 110, currentY);
      
      currentY += 7;
      pdf.text(`Report Date:            ${new Date().toLocaleDateString()}`, 20, currentY);
      pdf.text(`Analysis Time:         ${new Date().toLocaleTimeString()}`, 110, currentY);
      
      currentY += 12;

      // 3. Diagnostic Results Block
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('2. AI Diagnostic Outcome', 20, currentY);
      pdf.line(20, currentY + 2, 190, currentY + 2);

      currentY += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      
      if (label === 'No Tumor') {
        pdf.setTextColor(16, 185, 129); // green
      } else {
        pdf.setTextColor(239, 68, 68); // red
      }
      pdf.text(`Classification Outcome:  ${label} Presence Detected`, 20, currentY);
      
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Confidence Rating:        ${confidence}% Probability`, 20, currentY + 7);

      currentY += 18;

      // 4. Clinical observations
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('3. Pathological Observations & Guidelines', 20, currentY);
      pdf.line(20, currentY + 2, 190, currentY + 2);

      currentY += 10;
      
      const getTumorDescription = (tumorType) => {
        switch (tumorType) {
          case 'Glioma': return 'Gliomas represent primary brain tumors originating in glial cells. The AI scan identifies structural abnormalities conforming to glioma density grids. Clinical observation recommends checking for micro-lesion margins and surrounding tissue edema.';
          case 'Meningioma': return 'Meningiomas arise from the meningeal membranes. Typically slow-growing, they generate mass-effects against brain hemispheres. Surgical margins should be investigated based on visual contrast borders.';
          case 'No Tumor': return 'Normal anatomical scan. No evidence of masses, midline shifts, or contrast enhancements indicating tumor cells. Periodic monitoring is advised if symptoms persist.';
          case 'Pituitary': return 'Pituitary adenomas arise in the sella turcica region. Proximity to the optic chiasm requires immediate visual field mappings. Hormonal panel tests are indicated.';
          default: return 'Atypical pathological margins identified. Correlation with MRI spectroscopy is advised.';
        }
      };

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);
      const description = getTumorDescription(label);
      const descLines = pdf.splitTextToSize(description, 170);
      pdf.text(descLines, 20, currentY);

      currentY += (descLines.length * 5) + 6;

      // Custom doctor notes
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Clinical Observer Notes:', 20, currentY);
      
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9.5);
      pdf.setTextColor(100, 116, 139);
      const notes = doctorNotes || "No additional clinician annotations entered in report file.";
      const noteLines = pdf.splitTextToSize(notes, 170);
      pdf.text(noteLines, 20, currentY + 5);

      currentY += (noteLines.length * 5) + 12;

      // 5. Visual curves
      if (detailed && chartsRef && chartsRef.current) {
        pdf.addPage();
        currentY = 15;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(15, 23, 42);
        pdf.text('4. Diagnostic Data Visualizations', 20, currentY);
        pdf.line(20, currentY + 2, 190, currentY + 2);
        
        currentY += 10;

        const canvas = await html2canvas(chartsRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      }

      if (currentY > 240) {
        pdf.addPage();
        currentY = 20;
      } else {
        currentY = 240;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184);
      pdf.line(20, currentY, 190, currentY);
      
      currentY += 6;
      pdf.text('Diagnostic verification conducted by NEURODX AI Clinical Engine.', 20, currentY);
      pdf.text('NeuroDX Medical Diagnostics Corporation • Platform v1.0.0', 20, currentY + 4);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinician Sign-off:', 120, currentY);
      pdf.line(120, currentY + 12, 180, currentY + 12);
      
      const docName = `neuro_diagnosis_${patientId || 'scan'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(docName);

    } catch (err) {
      console.error("Error creating report PDF:", err);
      alert("Failed to build PDF report. Please check the browser console for details.");
    }
  };

  return (
    <div className="pdf-report-container">
      <div className="pdf-report-header">
        <h3>
          <FileText size={16} />
          Clinical Report Export Deck
        </h3>
        <p>Export authenticated clinical outcomes in PDF format.</p>
      </div>

      <div className="pdf-report-buttons">
        <button 
          type="button"
          className="btn btn-secondary"
          onClick={() => generatePDF(false)}
          disabled={!result}
        >
          <Download size={14} />
          Clinical Report
        </button>
        
        {chartsRef && chartsRef.current && (
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => generatePDF(true)}
            disabled={!result}
          >
            <Download size={14} />
            Visual Analytics Report
          </button>
        )}
      </div>

      <div className="pdf-report-info">
        <div className="info-card">
          <h4>
            <User size={14} />
            Clinical Report
          </h4>
          <ul>
            <li>Patient clinical parameters</li>
            <li>AI outcomes & confidence ratings</li>
            <li>Pathological descriptions</li>
            <li>Sign-off endorsement margins</li>
          </ul>
        </div>

        <div className="info-card">
          <h4>
            <Activity size={14} />
            Analytics Report
          </h4>
          <ul>
            <li>All basic clinical metadata</li>
            <li>Rendered probability charts</li>
            <li>Multi-class distribution details</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFReport;