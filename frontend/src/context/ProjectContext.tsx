import React, { createContext, useContext, useState, useEffect } from 'react'

export interface ProjectSummary {
  id: number
  name: string
  description?: string
  line_arrangement: string
  status: string
  updated_at?: string
  pole_count: number
  circuit_count: number
}

interface ProjectContextType {
  activeProject: ProjectSummary | null
  setActiveProject: (project: ProjectSummary | null) => void
  refreshProjects: () => Promise<ProjectSummary[]>
  loading: boolean
}

const ProjectContext = createContext<ProjectContextType>({
  activeProject: null,
  setActiveProject: () => {},
  refreshProjects: async () => [],
  loading: false,
})

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProjectState] = useState<ProjectSummary | null>(() => {
    const saved = localStorage.getItem('pole_select_active_project')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState(false)

  const setActiveProject = (proj: ProjectSummary | null) => {
    setActiveProjectState(proj)
    if (proj) {
      localStorage.setItem('pole_select_active_project', JSON.stringify(proj))
    } else {
      localStorage.removeItem('pole_select_active_project')
    }
  }

  const refreshProjects = async (): Promise<ProjectSummary[]> => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/')
      if (res.ok) {
        const projs: ProjectSummary[] = await res.json()
        if (projs.length > 0) {
          // If we have an active project, find its updated version
          if (activeProject) {
            const match = projs.find((p) => p.id === activeProject.id)
            if (match) {
              setActiveProject(match)
              return projs
            }
          }
          // Default to the first project with poles, or first project
          const withPoles = projs.find((p) => p.pole_count > 0) || projs[0]
          setActiveProject(withPoles)
        }
        return projs
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e)
    } finally {
      setLoading(false)
    }
    return []
  }

  useEffect(() => {
    refreshProjects()
  }, [])

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, refreshProjects, loading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => useContext(ProjectContext)
