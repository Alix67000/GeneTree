import React from 'react';
import { Card } from '@/components/ui/Card';
import { FiImage } from 'react-icons/fi';

export function Photos() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-text-primary">Family Gallery</h1>
        <p className="text-text-secondary mt-1">Preserve your family's precious moments.</p>
      </div>

      <Card className="text-center py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-4">
          <FiImage size={24} />
        </div>
        <h2 className="text-xl font-display font-medium text-text-primary">Photo gallery coming soon</h2>
        <p className="text-text-secondary max-w-md">
          Soon you will be able to upload, organize, and attach photos to people in your family tree.
        </p>
      </Card>
    </div>
  );
}
