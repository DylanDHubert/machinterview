import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FileText, Building, ChevronRight, Plus } from "lucide-react"

export default async function DashboardPage() {
  // Server-side authentication check
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect("/login")
  }
  
  // Fetch user's resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .order("created_at", { ascending: false })
  
  // Fetch user's jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="container max-w-6xl py-10 allow-scroll">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Resumes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Resumes</h2>
            <Link href="/dashboard/resume/new">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Resume
              </Button>
            </Link>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            {resumes && resumes.length > 0 ? (
              <div className="divide-y">
                {resumes.map((resume) => (
                  <div key={resume.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <Link href={`/dashboard/resume/${resume.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary p-2 rounded">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{resume.file_name}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(resume.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No resumes yet</h3>
                <p className="text-gray-500 mb-4">
                  Upload your first resume to get started
                </p>
                <Link href="/dashboard/resume/new">
                  <Button>Upload Resume</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Jobs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Job Applications</h2>
            <Link href="/dashboard/job/new">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Job
              </Button>
            </Link>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            {jobs && jobs.length > 0 ? (
              <div className="divide-y">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <Link href={`/dashboard/job/${job.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary p-2 rounded">
                            <Building className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-gray-500">
                              {job.company} • {new Date(job.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No jobs added</h3>
                <p className="text-gray-500 mb-4">
                  Add job details to prepare for your interviews
                </p>
                <Link href="/dashboard/job/new">
                  <Button>Add Job</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Practice Section */}
      <div className="mt-12">
        <div className="border rounded-lg overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to practice?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start an AI interview session with tailored questions based on your resume and job details
            </p>
            <Link href="/interview">
              <Button size="lg" className="gap-2">
                Start Interview Session
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 