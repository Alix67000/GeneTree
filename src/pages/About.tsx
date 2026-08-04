import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { GlobeDemo } from '@/components/ui/GlobeDemo';

export function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-primary">About GeneTree</h1>
        <p className="text-xl text-text-secondary">
          Preserving our heritage, generations, and memories.
        </p>
      </div>

      <Card className="p-8 space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-primary">Project Purpose</h2>
          <p className="text-text-secondary leading-relaxed">
            GeneTree is a dedicated family legacy project developed in 2026 by Ali Ahmadi to preserve our heritage, generations, and memories.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-primary">Access Policy</h2>
          <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <p className="text-text-secondary leading-relaxed">
              This application is private. To get login credentials, you must reach out through an existing family member or contact me directly.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-primary">Feedback & Corrections</h2>
          <p className="text-text-secondary leading-relaxed italic">
            Found a historical typo? Want to suggest an edit to your own birth year? Let me know! (if you're part of the family, you know where to find me ;)
          </p>
        </section>
        
        <div className="pt-4 flex justify-center">
          <Link to="/">
            <Button variant="outline">Return to Login</Button>
          </Link>
        </div>
      </Card>

      <GlobeDemo />
    </div>
  );
}
