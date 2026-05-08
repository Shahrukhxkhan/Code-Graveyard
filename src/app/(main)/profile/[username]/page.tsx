import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { MOCK_PROJECTS, MOCK_SNIPPETS, MOCK_USERS } from "@/lib/mock-data";

export default function ProfilePage({ params }: { params: { username: string } }) {
  const user = MOCK_USERS.find((item) => item.username === params.username);
  if (!user) notFound();

  const userProjects = MOCK_PROJECTS.filter((project) => project.user.username === user.username);
  const userSnippets = MOCK_SNIPPETS.filter((snippet) =>
    userProjects.some((project) => project.id === snippet.project_id),
  );

  return (
    <div className="w-full space-y-8">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-zinc-700">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
              <p className="text-zinc-400">@{user.username}</p>
              <p className="mt-2 text-zinc-300">{user.bio}</p>
              <div className="mt-3 flex items-center gap-3">
                <a href={`https://github.com/${user.github_username}`} className="text-zinc-400 hover:text-white">
                  <Globe className="h-4 w-4" />
                </a>
                <a href={user.website_url} className="text-zinc-400 hover:text-white">
                  <Globe className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-zinc-700 bg-zinc-950">
            Edit Profile
          </Button>
        </div>
        <div className="mt-6 flex flex-col divide-y divide-zinc-800 text-center sm:flex-row sm:divide-x sm:divide-y-0">
          <div className="px-6 py-3">
            <p className="text-xl font-semibold text-white">{userProjects.length}</p>
            <p className="text-sm text-zinc-400">Projects Buried</p>
          </div>
          <div className="px-6 py-3">
            <p className="text-xl font-semibold text-white">{userSnippets.length}</p>
            <p className="text-sm text-zinc-400">Snippets Shared</p>
          </div>
          <div className="px-6 py-3">
            <p className="text-xl font-semibold text-white">
              {userProjects.reduce((total, project) => total + project.adoption_count, 0)}
            </p>
            <p className="text-sm text-zinc-400">Adoptions</p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="bg-zinc-900">
          <TabsTrigger value="projects">Buried Projects ({userProjects.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="snippets">Snippets</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {userProjects.length === 0 ? (
            <EmptyState
              icon="🪦"
              title="No projects buried yet"
              description="When this developer buries a project, it will show up here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {userProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6 space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Saved Projects</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {MOCK_PROJECTS.slice(0, 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Saved Snippets</h2>
            <div className="space-y-3">
              {MOCK_SNIPPETS.slice(0, 3).map((snippet) => (
                <div key={snippet.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="font-medium text-white">{snippet.title}</p>
                  <p className="text-sm text-zinc-400">{snippet.description}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="snippets" className="mt-6">
          <div className="space-y-3">
            {MOCK_SNIPPETS.map((snippet) => {
              const project = MOCK_PROJECTS.find((item) => item.id === snippet.project_id);
              return (
                <div key={snippet.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{snippet.title}</p>
                    <Badge className="bg-violet-600/20 text-violet-300">{snippet.language}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
                    <Link href={`/project/${snippet.project_id}`} className="hover:text-white">
                      from {project?.title ?? "Unknown Project"}
                    </Link>
                    <button className="inline-flex items-center gap-1 hover:text-white">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
