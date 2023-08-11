import { Octokit } from 'octokit'
import * as path from 'path'
import * as url from 'url'
import quantile from 'compute-quantile'
import memoizeFs from 'memoize-fs'
import meow from 'meow'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cli = meow(`
    Usage
        $ repo-stat repo

    Examples
        $ foo arco-design/arco-design
    `, {
    importMeta: import.meta
})

const input = cli.input[0]
if (!input) {
    console.log('repo is required')
    process.exit(-1)
}

const [owner, repo] = input.split('/')
if (!owner || !repo) {
    console.log('You must enter the input in this format \'DouyinFE/semi-design\'')
    process.exit(-1)
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

const memoizer = memoizeFs({ cachePath: path.join(__dirname, './.cache') })
const request = await memoizer.fn(octokit.request)

async function getAllPulls() {
    const result = []
    let pulls = {
        data: []
    }
    let page = 1
    const per_page = 100
    do {
        console.log(`GET pulls page=${page} per_page=${per_page}`)
        pulls = await request('GET /repos/{owner}/{repo}/pulls', {
            owner,
            repo,
            state: 'all',
            per_page,
            page,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        if (pulls.status !== 200) {
            process.exit(-1)
        }
        result.push(...pulls.data)
        page++
    } while(pulls.data.length === 100)
    return result
}

const pulls = await getAllPulls()

const openingPulls = []
const closedPulls = []

for (const pull of pulls) {
    if (pull.state === 'open') {
        openingPulls.push(pull)
    }
    if (pull.state === 'closed') {
        closedPulls.push(pull)
    }
}

const spans = []
for (const pull of closedPulls) {
    const { merged_at, created_at } = pull
    if (merged_at) {
        const span = (new Date(merged_at) - new Date(created_at)) / (24 * 60 * 60 * 1000)
        spans.push(span)
    }
}

console.log('pulls number', pulls.length)
console.log('merged pulls number', spans.length)
console.log('quantile', quantile(spans, 0.8).toFixed(2))
