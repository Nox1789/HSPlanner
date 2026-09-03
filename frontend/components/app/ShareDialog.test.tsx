import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../utils/build/gistShare', () => {
  class GistShareError extends Error {
    kind: string
    constructor(kind: string, message: string) {
      super(message)
      this.kind = kind
    }
  }
  return {
    GistShareError,
    isGistSharingConfigured: vi.fn(() => true),
    uploadBuildToGist: vi.fn(async () => ({
      id: 'abc123',
      url: 'https://gist.github.com/u/abc123',
    })),
  }
})

vi.mock('../../utils/build/webShare', () => {
  class WebShareError extends Error {
    kind: string
    constructor(kind: string, message: string) {
      super(message)
      this.kind = kind
    }
  }
  return {
    WebShareError,
    isWebShareConfigured: vi.fn(() => true),
    buildSharePayload: vi.fn(async (build: unknown) => ({ build })),
    postWebShare: vi.fn(async () => ({
      id: 'x',
      url: 'https://hsplanner.app/b/XK3FQ2',
    })),
  }
})

import { ShareDialog, type ShareableSet } from './ShareDialog'
import {
  isGistSharingConfigured,
  uploadBuildToGist,
} from '../../utils/build/gistShare'
import {
  isWebShareConfigured,
  postWebShare,
  WebShareError,
} from '../../utils/build/webShare'
import { emptyBuildSnapshot } from '../../store/build/helpers'

afterEach(() => {
  vi.clearAllMocks()
  vi.mocked(isGistSharingConfigured).mockReturnValue(true)
  vi.mocked(isWebShareConfigured).mockReturnValue(true)
  vi.mocked(postWebShare).mockResolvedValue({
    id: 'x',
    url: 'https://hsplanner.app/b/XK3FQ2',
  })
})

const noop = () => {}

const fakeSet: ShareableSet = {
  id: 'p1',
  label: 'Set 1',
  snapshot: { ...emptyBuildSnapshot('amazon'), level: 50 },
}

function renderDialog(overrides?: { sets?: ShareableSet[] }) {
  return render(
    <ShareDialog
      sets={overrides?.sets ?? [fakeSet]}
      notes=""
      buildId="b1"
      buildName="Test Build"
      createdAt="2026-07-01T00:00:00.000Z"
      tags={[]}
      onClose={noop}
    />,
  )
}

function currentCode(): string {
  return (screen.getByRole('textbox') as HTMLTextAreaElement).value
}

async function pickMethod(
  user: ReturnType<typeof userEvent.setup>,
  label: string | RegExp,
) {
  await user.click(
    screen.getByRole('button', { name: /build code|gist link|hsplanner\.app/i }),
  )
  await user.click(screen.getByRole('option', { name: label }))
}

describe('ShareDialog — build code', () => {
  it('shows the code and copies it to the clipboard', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    renderDialog()
    const code = currentCode()
    expect(code.length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /copy code/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code)
    expect(await screen.findByText(/code copied/i)).toBeTruthy()
  })
})

describe('ShareDialog — gist link', () => {
  it('creates a gist and shows the copied link', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    renderDialog()
    const code = currentCode()
    await pickMethod(user, 'Gist link')
    await user.click(screen.getByRole('button', { name: /create link/i }))
    await waitFor(() =>
      expect(
        screen.getByDisplayValue('https://gist.github.com/u/abc123'),
      ).toBeTruthy(),
    )
    expect(vi.mocked(uploadBuildToGist)).toHaveBeenCalledWith(code, {
      className: 'Amazon',
      level: 50,
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://gist.github.com/u/abc123',
    )
  })

  it('disables link creation when gist sharing is not configured', async () => {
    vi.mocked(isGistSharingConfigured).mockReturnValue(false)
    const user = userEvent.setup()
    renderDialog()
    await pickMethod(user, 'Gist link')
    expect(screen.getByRole('button', { name: /create link/i })).toBeDisabled()
    expect(screen.getByText(/not configured in this build/i)).toBeTruthy()
  })
})

describe('ShareDialog — hsplanner.app link', () => {
  it('creates a web share and shows the copied link', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    renderDialog()
    await pickMethod(user, /hsplanner\.app/i)
    await user.click(screen.getByRole('button', { name: /create link/i }))
    await waitFor(() =>
      expect(
        screen.getByDisplayValue('https://hsplanner.app/b/XK3FQ2'),
      ).toBeTruthy(),
    )
    expect(vi.mocked(postWebShare)).toHaveBeenCalledTimes(1)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://hsplanner.app/b/XK3FQ2',
    )
  })

  it('surfaces web share errors', async () => {
    vi.mocked(postWebShare).mockRejectedValue(
      new WebShareError('too-large', 'This build is too large to share to the web.'),
    )
    const user = userEvent.setup()
    renderDialog()
    await pickMethod(user, /hsplanner\.app/i)
    await user.click(screen.getByRole('button', { name: /create link/i }))
    expect(
      await screen.findByText(/too large to share/i),
    ).toBeTruthy()
  })

  it('disables link creation when web sharing is not configured', async () => {
    vi.mocked(isWebShareConfigured).mockReturnValue(false)
    const user = userEvent.setup()
    renderDialog()
    await pickMethod(user, /hsplanner\.app/i)
    expect(screen.getByRole('button', { name: /create link/i })).toBeDisabled()
    expect(screen.getByText(/not configured in this build/i)).toBeTruthy()
  })
})
