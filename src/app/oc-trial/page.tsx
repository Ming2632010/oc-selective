import { ProgramPage } from '@/components/marketing/program-page';
import { getProgram } from '@/lib/programs';

const program = getProgram('oc');

export const metadata = {
  title: program.metaTitle,
  description: program.metaDescription,
  alternates: { canonical: program.href },
};

export default function OcTrialPage() {
  return <ProgramPage program={program} />;
}
