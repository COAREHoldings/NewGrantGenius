import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { state, totals, rule } = await request.json();

    // Generate structured justification based on NIH/NCI guidelines
    const justificationSections: string[] = [];

    // Header
    justificationSections.push(`BUDGET JUSTIFICATION\n${state.projectTitle}\n${rule?.fullName || state.grantType}\nDuration: ${state.duration} months\n`);

    // Personnel Section
    if (state.personnel?.length > 0) {
      justificationSections.push('A. PERSONNEL\n');
      state.personnel.forEach((person: any) => {
        const salary = (person.baseSalary * person.effortPercent / 100) * (person.months / 12);
        const fringe = salary * (state.customFringeRate ?? rule?.fringeRate ?? 0.30);
        justificationSections.push(
          `${person.name} - ${person.role}\n` +
          `${person.effortPercent}% effort for ${person.months} months\n` +
          `Base Salary: $${person.baseSalary.toLocaleString()}\n` +
          `Salary Requested: $${salary.toLocaleString()}\n` +
          `Fringe Benefits (${((state.customFringeRate ?? rule?.fringeRate ?? 0.30) * 100).toFixed(0)}%): $${fringe.toLocaleString()}\n` +
          `${person.role === 'Principal Investigator' ? 'The PI will provide overall direction and leadership for the project.' : 
            person.role === 'Co-Investigator' ? 'The Co-I will contribute specialized expertise to the project.' :
            person.role === 'Postdoctoral Fellow' ? 'The postdoctoral fellow will conduct key experiments and analyses.' :
            person.role === 'Graduate Student' ? 'The graduate student will assist with data collection and analysis.' :
            `${person.role} will contribute to project activities.`}\n`
        );
      });
    }

    // Equipment Section
    const equipment = state.directCosts?.filter((c: any) => c.category === 'equipment') || [];
    if (equipment.length > 0 || totals.equipment > 0) {
      justificationSections.push('\nB. EQUIPMENT\n');
      if (equipment.length > 0) {
        equipment.forEach((item: any) => {
          justificationSections.push(
            `${item.description}: $${item.amount.toLocaleString()}\n` +
            `${item.justification || 'This equipment is essential for conducting the proposed research.'}\n`
          );
        });
      } else {
        justificationSections.push('No equipment costs requested.\n');
      }
    }

    // Supplies Section
    const supplies = state.directCosts?.filter((c: any) => c.category === 'supplies') || [];
    if (supplies.length > 0 || totals.supplies > 0) {
      justificationSections.push('\nC. SUPPLIES\n');
      if (supplies.length > 0) {
        supplies.forEach((item: any) => {
          justificationSections.push(
            `${item.description}: $${item.amount.toLocaleString()}\n` +
            `${item.justification || 'These supplies are necessary for the proposed research activities.'}\n`
          );
        });
      }
    }

    // Travel Section
    const travel = state.directCosts?.filter((c: any) => c.category === 'travel') || [];
    if (travel.length > 0 || totals.travel > 0) {
      justificationSections.push('\nD. TRAVEL\n');
      if (travel.length > 0) {
        travel.forEach((item: any) => {
          justificationSections.push(
            `${item.description}: $${item.amount.toLocaleString()}\n` +
            `${item.justification || 'Travel is necessary to present findings at scientific conferences and meetings.'}\n`
          );
        });
      }
    }

    // Consultant Services
    const consultants = state.directCosts?.filter((c: any) => c.category === 'consultant') || [];
    if (consultants.length > 0) {
      justificationSections.push('\nE. CONSULTANT SERVICES\n');
      consultants.forEach((item: any) => {
        justificationSections.push(
          `${item.description}: $${item.amount.toLocaleString()}\n` +
          `${item.justification || 'Consultant expertise is required to complement the skills of the project team.'}\n`
        );
      });
    }

    // Subcontracts
    const subcontracts = state.directCosts?.filter((c: any) => c.category === 'subcontract') || [];
    if (subcontracts.length > 0) {
      justificationSections.push('\nF. SUBCONTRACTS/CONSORTIUM ARRANGEMENTS\n');
      subcontracts.forEach((item: any) => {
        justificationSections.push(
          `${item.description}: $${item.amount.toLocaleString()}\n` +
          `${item.justification || 'This subcontract provides specialized services not available at the primary institution.'}\n`
        );
      });
      if (rule?.subcontractLimit) {
        const subcontractPercent = (totals.subcontracts / totals.totalBudget) * 100;
        justificationSections.push(
          `\nNote: Subcontracts represent ${subcontractPercent.toFixed(1)}% of total budget ` +
          `(limit: ${(rule.subcontractLimit * 100).toFixed(0)}%).\n`
        );
      }
    }

    // Other Direct Costs
    const other = state.directCosts?.filter((c: any) => c.category === 'other') || [];
    if (other.length > 0) {
      justificationSections.push('\nG. OTHER DIRECT COSTS\n');
      other.forEach((item: any) => {
        justificationSections.push(
          `${item.description}: $${item.amount.toLocaleString()}\n` +
          `${item.justification || 'This expense is essential for project completion.'}\n`
        );
      });
    }

    // Indirect Costs
    justificationSections.push('\nH. INDIRECT COSTS (F&A)\n');
    const indirectRate = state.customIndirectRate ?? rule?.indirectRate ?? 0.50;
    justificationSections.push(
      `Indirect costs are calculated at ${(indirectRate * 100).toFixed(0)}% ` +
      `of ${rule?.indirectBase || 'MTDC'} (Modified Total Direct Costs).\n` +
      `Indirect Base: $${totals.indirectBase.toLocaleString()}\n` +
      `Indirect Costs: $${totals.indirectCosts.toLocaleString()}\n`
    );

    // Budget Summary
    justificationSections.push('\n' + '='.repeat(50) + '\n');
    justificationSections.push('BUDGET SUMMARY\n');
    justificationSections.push(`Total Personnel: $${totals.personnelTotal.toLocaleString()}\n`);
    justificationSections.push(`Total Direct Costs: $${totals.totalDirectCosts.toLocaleString()}\n`);
    justificationSections.push(`Total Indirect Costs: $${totals.indirectCosts.toLocaleString()}\n`);
    justificationSections.push(`TOTAL BUDGET: $${totals.totalBudget.toLocaleString()}\n`);

    if (rule?.maxBudget) {
      const utilizationPercent = (totals.totalBudget / rule.maxBudget) * 100;
      justificationSections.push(
        `\nBudget Utilization: ${utilizationPercent.toFixed(1)}% of $${rule.maxBudget.toLocaleString()} maximum\n`
      );
    }

    const justification = justificationSections.join('');

    return NextResponse.json({ justification });
  } catch (error) {
    console.error('Justification generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate justification' },
      { status: 500 }
    );
  }
}
