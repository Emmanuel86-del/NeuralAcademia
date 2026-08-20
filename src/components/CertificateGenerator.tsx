import React from 'react';
import { Award, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate?: string;
}

export function CertificateGenerator({ studentName, courseName, completionDate = 'August 2026' }: CertificateProps) {
  
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Background styling
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 297, 210, 'F');

    // Border Frame
    doc.setLineWidth(1.5);
    doc.setStrokeColor(79, 70, 229); // Indigo border
    doc.rect(15, 15, 267, 180);

    doc.setLineWidth(0.5);
    doc.setStrokeColor(199, 210, 254);
    doc.rect(18, 18, 261, 174);

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(30, 41, 59);
    doc.text('NEURAL ACADEMY', 148.5, 45, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('CERTIFICATE OF COMPLETION', 148.5, 55, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.text('This is proudly presented to', 148.5, 75, { align: 'center' });

    // Student Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(79, 70, 229);
    doc.text(studentName || 'Student Name', 148.5, 95, { align: 'center' });

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `for successfully mastering the curriculum and completing all requirements for`,
      148.5,
      115,
      { align: 'center' }
    );

    // Course Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(courseName, 148.5, 128, { align: 'center' });

    // Footer details (Date & Signatures)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);

    doc.text(`Date: ${completionDate}`, 60, 165, { align: 'center' });
    doc.line(30, 158, 90, 158);

    doc.text('Neural Academy Platform', 237, 165, { align: 'center' });
    doc.line(207, 158, 267, 158);

    // Save the PDF file
    doc.save(`${studentName.replace(/\s+/g, '_')}_Certificate.pdf`);
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-lg">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Completion Certificate</h3>
          <p className="text-sm text-gray-500">Download your official verified certificate for {courseName}</p>
        </div>
      </div>
      <button
        onClick={generatePDF}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md shadow-indigo-500/20 transition-all"
      >
        <Download className="w-4 h-4" />
        <span>Download Certificate</span>
      </button>
    </div>
  );
}