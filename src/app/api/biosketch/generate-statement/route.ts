import { NextRequest, NextResponse } from 'next/server';

// Generate a personal statement for a team member based on their role and project
export async function POST(request: NextRequest) {
  try {
    const { name, role, institution, projectTitle, projectDescription, expertise } = await request.json();

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    // Generate role-specific personal statement
    let statement = '';
    
    switch (role) {
      case 'Principal Investigator':
        statement = `As the Principal Investigator, ${name} will provide overall scientific leadership and direction for this project${projectTitle ? ` titled "${projectTitle}"` : ''}. ${name} brings extensive expertise${expertise ? ` in ${expertise}` : ''} and will be responsible for coordinating all research activities, ensuring scientific rigor, and achieving project milestones. ${institution ? `Based at ${institution}, ` : ''}${name} will oversee the research team, manage collaborations, and ensure timely completion of all aims. ${name}'s leadership will be critical to the successful translation of research findings into practical applications.`;
        break;
      
      case 'Co-Investigator':
        statement = `${name} will serve as Co-Investigator on this project, contributing significant intellectual and technical expertise${expertise ? ` in ${expertise}` : ''}. ${institution ? `From ${institution}, ` : ''}${name} will collaborate closely with the Principal Investigator to design experiments, analyze data, and interpret results. ${name}'s contributions will be essential to achieving the project's scientific objectives and will include direct involvement in experimental work, manuscript preparation, and training of junior team members.`;
        break;
      
      case 'Key Personnel':
        statement = `${name} will participate as Key Personnel, providing specialized expertise${expertise ? ` in ${expertise}` : ''} critical to project success. ${institution ? `At ${institution}, ` : ''}${name} will contribute to specific technical aspects of the research, including experimental design, data collection, and analysis. ${name}'s unique skills and experience will complement the research team and ensure rigorous execution of the proposed studies.`;
        break;
      
      case 'Consultant':
        statement = `${name} will serve as a Consultant, providing expert guidance${expertise ? ` in ${expertise}` : ''} throughout the project duration. ${institution ? `Based at ${institution}, ` : ''}${name} will advise on technical approaches, review experimental designs, and provide recommendations to optimize research outcomes. ${name}'s external perspective and specialized knowledge will strengthen the scientific foundation of this project.`;
        break;
      
      case 'Collaborator':
        statement = `${name} will collaborate on this project, contributing complementary expertise${expertise ? ` in ${expertise}` : ''}. ${institution ? `Through ${institution}, ` : ''}${name} will work with the research team on specific aims that align with their expertise, facilitating knowledge exchange and enhancing the project's interdisciplinary approach. This collaboration will expand the project's capabilities and increase the potential for impactful outcomes.`;
        break;
      
      default:
        statement = `${name} will contribute to this project${expertise ? ` with expertise in ${expertise}` : ''}. ${institution ? `Working from ${institution}, ` : ''}${name} will support the research objectives and collaborate with team members to achieve project goals.`;
    }

    return NextResponse.json({ 
      statement,
      role,
      name,
      wordCount: statement.split(/\s+/).length
    });
  } catch (error) {
    console.error('Error generating statement:', error);
    return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 });
  }
}
