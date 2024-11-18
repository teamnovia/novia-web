import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const ConfigNeeded = ({ message }: { message: string }) => {
  return (
    <div className="alert border-warning text-warning mt-8">
      <ExclamationTriangleIcon className="w-8" />
      <div className="block">
        {message}. Go to{' '}
        <a className="font-bold" href="/settings">
          Settings
        </a>{' '}
        to configure them!
      </div>
    </div>
  );
};
