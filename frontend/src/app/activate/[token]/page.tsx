import ActivationForm from '@/components/forms/ActivationForm';

interface ActivationPageProps {
  params: {
    token: string;
  };
}

export default function ActivationPage({ params }: ActivationPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ActivationForm token={params.token} />
    </div>
  );
}