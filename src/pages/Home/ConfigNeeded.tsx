import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const ConfigNeeded = ({ message }: { message: string }) => {
  return (
    <div className="alert border-warning text-warning w-10/12 mt-8 mx-auto">
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
