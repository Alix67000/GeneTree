import React from 'react';
import { usePersons } from '../hooks/usePersons';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { getInitials } from '../lib/utils';
import { FiPlus, FiUser } from 'react-icons/fi';

export function Tree() {
  // Fetch persons data using custom hook
  const { persons, loading } = usePersons();

  // Show loading state while data is being fetched
  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold text-text-primary">Family Tree</h1>
        <Link to="/person/add" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-light transition-colors">
          <FiPlus /> Add Person
        </Link>
      </div>

      {persons.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FiUser size={24} />
          </div>
          <h2 className="text-xl font-display font-medium text-text-primary">Your tree is empty</h2>
          <p className="text-text-secondary">Start building your family tree by adding the first person.</p>
          <Link to="/person/add" className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-medium mt-4">
            <FiPlus /> Add First Person
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {persons.map(person => (
            <Link key={person.id} to={`/person/${person.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col items-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-accent bg-border ring-4 ring-white shadow-lg flex items-center justify-center text-2xl font-display font-medium text-text-primary overflow-hidden">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={`${person.firstName} ${person.lastName}`} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(person.firstName, person.lastName)
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary">{person.firstName} {person.lastName}</h3>
                  <p className="text-sm text-text-secondary mt-1 italic">
                    {person.birthYear} {person.deathYear ? `— ${person.deathYear}` : '— Present'}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
