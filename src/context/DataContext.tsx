import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Project, TestSuite, Defect } from '../types';

interface DataContextType {
  projects: Project[];
  testSuites: TestSuite[];
  defects: Defect[];
  loading: boolean;

  addProject: (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addTestSuite: (suite: Omit<TestSuite, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTestSuite: (id: string, updates: Partial<TestSuite>) => Promise<void>;
  deleteTestSuite: (id: string) => Promise<void>;
  getSubSuites: (parentId: string) => TestSuite[];

  addDefect: (defect: Omit<Defect, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDefect: (id: string, updates: Partial<Defect>) => Promise<void>;
  deleteDefect: (id: string) => Promise<void>;

  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const fetchTestSuites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('test_suites')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTestSuites(data);
    }
  };

  const fetchDefects = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('defects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDefects(data);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchProjects(), fetchTestSuites(), fetchDefects()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setProjects([]);
      setTestSuites([]);
      setDefects([]);
      setLoading(false);
    }
  }, [user]);

  const addProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      ...project,
    });

    if (!error) {
      await fetchProjects();
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      await fetchProjects();
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (!error) {
      await fetchProjects();
    }
  };

  const addTestSuite = async (suite: Omit<TestSuite, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase.from('test_suites').insert({
      user_id: user.id,
      ...suite,
    });

    if (!error) {
      await fetchTestSuites();
    }
  };

  const updateTestSuite = async (id: string, updates: Partial<TestSuite>) => {
    if (!user) return;

    const { error } = await supabase
      .from('test_suites')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      await fetchTestSuites();
    }
  };

  const deleteTestSuite = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('test_suites').delete().eq('id', id);

    if (!error) {
      await fetchTestSuites();
    }
  };

  const getSubSuites = (parentId: string) => {
    return testSuites.filter(suite => suite.parent_suite_id === parentId);
  };

  const addDefect = async (defect: Omit<Defect, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase.from('defects').insert({
      user_id: user.id,
      ...defect,
    });

    if (!error) {
      await fetchDefects();
    }
  };

  const updateDefect = async (id: string, updates: Partial<Defect>) => {
    if (!user) return;

    const { error } = await supabase
      .from('defects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      await fetchDefects();
    }
  };

  const deleteDefect = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('defects').delete().eq('id', id);

    if (!error) {
      await fetchDefects();
    }
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        testSuites,
        defects,
        loading,
        addProject,
        updateProject,
        deleteProject,
        addTestSuite,
        updateTestSuite,
        deleteTestSuite,
        getSubSuites,
        addDefect,
        updateDefect,
        deleteDefect,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
