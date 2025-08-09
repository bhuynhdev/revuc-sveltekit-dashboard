<!-- +layout.svelte -->
<script lang="ts">
  import IconTablerChalkboard from '~icons/tabler/chalkboard'
  import IconTablerMailFast from '~icons/tabler/mail-fast'
  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()
</script>

<div class="grid min-h-screen grid-rows-[auto_1fr_auto]">
  <header class="bg-diagonal-pattern border-b p-4">
    RevolutionUC Dashboard <IconTablerChalkboard class="inline" aria-hidden="true" />
  </header>

  <div class="grid grid-cols-1 md:grid-cols-[auto_1fr]">
    <!-- Left-side navbar -->
    <nav class="hidden w-64 py-4 md:block" aria-label="Main navigation">
      <ul class="menu w-full space-y-1">
        <li>
          <a href="/participants" class="px-4 py-2">Participants</a>
        </li>

        <li>
          <details open>
            <summary class="px-4 py-2">
              <span>Judging</span>
            </summary>
            <ul>
              <li>
                <a href="/categories" class="px-4 py-2">Categories</a>
              </li>
              <li>
                <a href="/judges" class="px-4 py-2">Judges &amp; Groups</a>
              </li>
              <li>
                <a href="/projects" class="px-4 py-2">Projects</a>
              </li>
              <li>
                <a href="/assignments" class="px-4 py-2">Project assignments</a>
              </li>
              <li>
                <a href="/prizing" class="px-4 py-2">Prizing</a>
              </li>
            </ul>
          </details>
        </li>

        <li>
          <details open>
            <summary class="px-4 py-2">
              <span>Emails</span>
            </summary>
            <ul>
              <li>
                <a href="/emails/send" class="px-4 py-2">
                  <IconTablerMailFast class="mr-2 inline" /> Send
                </a>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <main class="mx-auto p-4 lg:w-11/12">
      {@render children()}
    </main>
  </div>

  <!-- Footer -->
  <footer class="p-4">(footer)</footer>
</div>
