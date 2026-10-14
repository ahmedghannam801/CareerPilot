/**
 * CareerPilot AI — Proper DOCX Generation Service
 *
 * Generates valid Office Open XML DOCX files using the `docx` library.
 * Ensures ATS compatibility and proper formatting.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageBreakBefore,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';
import { ResumeVersion } from '../../types/index.js';

// Google Doc ATS Template Colors
const COLORS = {
  navy: '1f3864',
  darkGray: '333333',
  mediumGray: '666666',
  lightGray: 'e8e8e8',
  white: 'ffffff',
  accent: '2a5caa',
};

const FONTS = {
  heading: 'Calibri',
  body: 'Calibri',
};

/**
 * Generate a proper DOCX file from resume data
 */
export async function generateResumeDOCX(
  resume: ResumeVersion,
  templateType: 'google_doc' | 'classic' | 'modern' = 'google_doc'
): Promise<Buffer> {
  const doc = new Document({
    creator: resume.summary ? 'CareerPilot AI' : 'CareerPilot',
    title: resume.title,
    description: resume.targetRole ? `${resume.targetRole} Resume` : 'Resume',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
            size: {
              width: 12240, // A4 width in twips
              height: 15840, // A4 height in twips
            },
          },
        },
        children: buildResumeContent(resume, templateType),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Build resume content based on template type
 */
function buildResumeContent(
  resume: ResumeVersion,
  templateType: 'google_doc' | 'classic' | 'modern'
): Paragraph[] {
  const children: Paragraph[] = [];

  // Header with name and contact info
  children.push(buildHeader(resume));

  // Professional Summary
  if (resume.summary) {
    children.push(buildSectionTitle('Professional Summary', templateType));
    children.push(buildParagraph(resume.summary));
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    children.push(buildSectionTitle('Skills', templateType));
    children.push(buildParagraph(resume.skills.join(' • ')));
  }

  // Work Experience
  if (resume.experience && resume.experience.length > 0) {
    children.push(buildSectionTitle('Work Experience', templateType));
    for (const exp of resume.experience) {
      children.push(buildExperienceEntry(exp, templateType));
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    children.push(buildSectionTitle('Education', templateType));
    for (const edu of resume.education) {
      children.push(buildEducationEntry(edu, templateType));
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(buildSectionTitle('Certifications', templateType));
    children.push(buildParagraph(resume.certifications.join(' • ')));
  }

  return children;
}

/**
 * Build header with name, title, and contact info
 */
function buildHeader(resume: ResumeVersion): Paragraph {
  const runs: TextRun[] = [];

  // Name (largest)
  runs.push(
    new TextRun({
      text: resume.title.replace(' Resume', '').replace(' CV', ''),
      bold: true,
      size: 56, // 28pt
      font: FONTS.heading,
      color: COLORS.navy,
    })
  );

  // Target Role
  if (resume.targetRole) {
    runs.push(
      new TextRun({
        text: '\n' + resume.targetRole,
        bold: false,
        size: 28, // 14pt
        font: FONTS.body,
        color: COLORS.mediumGray,
      })
    );
  }

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 400,
    },
    children: runs,
  });
}

/**
 * Build section title
 */
function buildSectionTitle(title: string, templateType: string): Paragraph {
  const color = templateType === 'google_doc' ? COLORS.navy : COLORS.darkGray;

  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_1,
    spacing: {
      before: 480,
      after: 240,
    },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: color,
      },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24, // 12pt
        font: FONTS.heading,
        color,
      }),
    ],
  });
}

/**
 * Build a regular paragraph
 */
function buildParagraph(text: string): Paragraph {
  return new Paragraph({
    text: '',
    spacing: {
      after: 200,
      line: 276, // 1.15 line spacing
    },
    children: [
      new TextRun({
        text: text,
        size: 22, // 11pt
        font: FONTS.body,
        color: COLORS.darkGray,
      }),
    ],
  });
}

/**
 * Build experience entry with role, company, dates, and achievements
 */
function buildExperienceEntry(
  exp: { role: string; company: string; startDate?: string; endDate?: string; current?: boolean; achievements?: string[] },
  templateType: string
): Paragraph {
  const paragraphs: Paragraph[] = [];

  // Role and Company header
  const headerRuns = [
    new TextRun({
      text: exp.role,
      bold: true,
      size: 22,
      font: FONTS.body,
      color: COLORS.darkGray,
    }),
    new TextRun({
      text: ' | ',
      size: 20,
      color: COLORS.mediumGray,
    }),
    new TextRun({
      text: exp.company,
      size: 20,
      color: COLORS.mediumGray,
    }),
  ];

  if (exp.startDate) {
    const dateRange = exp.endDate
      ? `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`
      : exp.current
        ? `${formatDate(exp.startDate)} - Present`
        : formatDate(exp.startDate);

    headerRuns.push(
      new TextRun({
        text: ' | ' + dateRange,
        size: 18,
        color: COLORS.mediumGray,
        italics: true,
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      spacing: {
        before: 240,
        after: 120,
      },
      children: headerRuns,
    })
  );

  // Achievements as bullet points
  if (exp.achievements && exp.achievements.length > 0) {
    for (const achievement of exp.achievements) {
      paragraphs.push(
        new Paragraph({
          text: '',
          indent: {
            left: 720, // 0.5 inch
          },
          spacing: {
            after: 80,
          },
          children: [
            new TextRun({
              text: '• ' + achievement,
              size: 20,
              font: FONTS.body,
              color: COLORS.darkGray,
            }),
          ],
        })
      );
    }
  }

  return paragraphs[0];
}

/**
 * Build education entry
 */
function buildEducationEntry(
  edu: { institution: string; degree: string; field: string; startDate?: string; endDate?: string; current?: boolean; gpa?: string },
  templateType: string
): Paragraph {
  const headerText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;

  const runs = [
    new TextRun({
      text: headerText,
      bold: true,
      size: 22,
      font: FONTS.body,
      color: COLORS.darkGray,
    }),
    new TextRun({
      text: ' | ' + edu.institution,
      size: 20,
      color: COLORS.mediumGray,
    }),
  ];

  if (edu.startDate) {
    const dateRange = edu.endDate
      ? `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`
      : edu.current
        ? `${formatDate(edu.startDate)} - Present`
        : formatDate(edu.startDate);

    runs.push(
      new TextRun({
        text: ' | ' + dateRange,
        size: 18,
        color: COLORS.mediumGray,
        italics: true,
      })
    );
  }

  if (edu.gpa) {
    runs.push(
      new TextRun({
        text: ` | GPA: ${edu.gpa}`,
        size: 18,
        color: COLORS.mediumGray,
      })
    );
  }

  return new Paragraph({
    spacing: {
      before: 120,
      after: 120,
    },
    children: runs,
  });
}

/**
 * Format date from YYYY-MM to MMM YYYY
 */
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return dateStr;

  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = parseInt(month, 10) - 1;

  if (monthIndex >= 0 && monthIndex < 12) {
    return `${months[monthIndex]} ${year}`;
  }
  return dateStr;
}

/**
 * Generate a simple text-only version of resume for maximum ATS compatibility
 */
export async function generateATSFriendlyDOCX(resume: ResumeVersion): Promise<Buffer> {
  let textContent = '';

  // Header
  textContent += resume.title.replace(' Resume', '').replace(' CV', '') + '\n';
  if (resume.targetRole) {
    textContent += resume.targetRole + '\n';
  }
  textContent += '\n';

  // Summary
  if (resume.summary) {
    textContent += 'PROFESSIONAL SUMMARY\n';
    textContent += '-'.repeat(30) + '\n';
    textContent += resume.summary + '\n\n';
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    textContent += 'SKILLS\n';
    textContent += '-'.repeat(30) + '\n';
    textContent += resume.skills.join(', ') + '\n\n';
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    textContent += 'WORK EXPERIENCE\n';
    textContent += '-'.repeat(30) + '\n';
    for (const exp of resume.experience) {
      textContent += `${exp.role} at ${exp.company}\n`;
      if (exp.startDate) {
        const end = exp.current ? 'Present' : exp.endDate;
        textContent += `${exp.startDate} - ${end}\n`;
      }
      if (exp.achievements) {
        for (const ach of exp.achievements) {
          textContent += `• ${ach}\n`;
        }
      }
      textContent += '\n';
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    textContent += 'EDUCATION\n';
    textContent += '-'.repeat(30) + '\n';
    for (const edu of resume.education) {
      textContent += `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}\n`;
      textContent += `${edu.institution}\n`;
      if (edu.startDate) {
        textContent += `${edu.startDate}${edu.endDate ? ` - ${edu.endDate}` : ''}\n`;
      }
      textContent += '\n';
    }
  }

  // Create simple document with just text
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: textContent,
            children: [
              new TextRun({
                text: textContent,
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}