import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  originalContent?: string;
}

export const generatePDF = async (
  messages: ConversationMessage[],
  feedback: string,
  interviewType: string
): Promise<void> => {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set up document properties
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = 20;
  
  // Add title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`AI Interview Assistant - ${interviewType} Interview`, margin, yPosition);
  yPosition += 10;
  
  // Add date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;
  
  // Add conversation heading
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Interview Conversation', margin, yPosition);
  yPosition += 10;
  
  // Add conversation content
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Filter out system messages
  const visibleMessages = messages.filter(msg => msg.role !== 'system');
  
  // Add each message
  for (const message of visibleMessages) {
    // Add role label
    pdf.setFont('helvetica', 'bold');
    pdf.text(message.role === 'user' ? 'You:' : 'AI Interviewer:', margin, yPosition);
    yPosition += 5;
    
    // Add message content
    pdf.setFont('helvetica', 'normal');
    
    // For user messages with original content
    if (message.role === 'user') {
      // Split long text into lines for OpenAI transcription
      const textLines = pdf.splitTextToSize(message.content, contentWidth);
      
      // Check if we need a new page
      if (yPosition + (textLines.length * 5) > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Add OpenAI transcription
      pdf.text(textLines, margin, yPosition);
      yPosition += (textLines.length * 5) + 5;
      
      // Add original transcription in brackets if available
      if (message.originalContent) {
        pdf.setFont('helvetica', 'italic');
        
        // Format original content in brackets
        const originalContent = `[Original: ${message.originalContent}]`;
        
        // Split original transcription into lines
        const originalTextLines = pdf.splitTextToSize(originalContent, contentWidth);
        
        // Check if we need a new page
        if (yPosition + (originalTextLines.length * 5) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(originalTextLines, margin, yPosition);
        yPosition += (originalTextLines.length * 5) + 5;
        
        // Reset font
        pdf.setFont('helvetica', 'normal');
      }
    } else {
      // For AI responses
      // Split long text into lines
      const textLines = pdf.splitTextToSize(message.content, contentWidth);
      
      // Check if we need a new page
      if (yPosition + (textLines.length * 5) > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(textLines, margin, yPosition);
      yPosition += (textLines.length * 5) + 5;
    }
    
    // Add a separator line between messages
    pdf.setDrawColor(200, 200, 200); // Light gray
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  }
  
  // Add feedback section
  pdf.addPage();
  yPosition = 20;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Interview Feedback', margin, yPosition);
  yPosition += 10;
  
  // Add feedback content
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Split feedback into lines
  const feedbackLines = pdf.splitTextToSize(feedback, contentWidth);
  
  // Add feedback text with pagination if needed
  let currentLine = 0;
  while (currentLine < feedbackLines.length) {
    const remainingLines = pdf.internal.pageSize.getHeight() - yPosition - margin;
    const linesToAdd = Math.min(Math.floor(remainingLines / 5), feedbackLines.length - currentLine);
    
    if (linesToAdd <= 0) {
      pdf.addPage();
      yPosition = 20;
      continue;
    }
    
    const pageLines = feedbackLines.slice(currentLine, currentLine + linesToAdd);
    pdf.text(pageLines, margin, yPosition);
    
    currentLine += linesToAdd;
    yPosition += (linesToAdd * 5);
    
    if (currentLine < feedbackLines.length) {
      pdf.addPage();
      yPosition = 20;
    }
  }
  
  // Save the PDF
  pdf.save(`interview_${interviewType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Function to convert HTML to PDF (for more complex formatting)
export const generatePDFFromHTML = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found');
    return;
  }
  
  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit the page
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasRatio = canvas.height / canvas.width;
    const imgWidth = pageWidth - 20;
    const imgHeight = imgWidth * canvasRatio;
    
    // Add image to PDF
    let heightLeft = imgHeight;
    let position = 10;
    let pageNumber = 1;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      pageNumber++;
    }
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}; 