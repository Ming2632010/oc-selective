import { redirect } from 'next/navigation';

/** Old layout-demo URL. The trial warm-up is the real computer-test screen. */
export default function SelectiveMathPreviewPage() {
  redirect('/dashboard/selective-math');
}
