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

function getLastPage(link) {
    const last = link.split(',')[1]
    const lastLink = last.split(';')[0].trim()
    const lastUrl = lastLink.substring(1, lastLink.length - 1)
    const lastUrlObj = new URL(lastUrl)
    return Number(lastUrlObj.searchParams.get('page'))
}

async function getAllPulls() {
    const result = []

    const per_page = 100

    console.log(`GET pulls page=1 per_page=${per_page}`)
    const pulls = await request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        state: 'all',
        per_page,
        page: 1,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
    if (pulls.status !== 200) {
        process.exit(-1)
    }
    result.push(...pulls.data)

    const lastPage = getLastPage(pulls.headers.link)
    const tasks = []
    for (let i = 2; i <= lastPage; i++) {
        console.log(`GET pulls page=${i} per_page=${per_page}`)
        tasks.push(
            request('GET /repos/{owner}/{repo}/pulls', {
                owner,
                repo,
                state: 'all',
                per_page,
                page: i,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }).then(pulls => {
                if (pulls.status !== 200) {
                    process.exit(-1)
                }
                result.push(...pulls.data)
            })
        )
    }
    await Promise.all(tasks)

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

const pullSpans = []
for (const pull of closedPulls) {
    const { merged_at, created_at } = pull
    if (merged_at) {
        const span = (new Date(merged_at) - new Date(created_at)) / (24 * 60 * 60 * 1000)
        pullSpans.push(span)
    }
}

console.log('pulls number', pulls.length)
console.log('merged pulls number', pullSpans.length)
console.log('merged pulls processing speed', quantile(pullSpans, 0.8).toFixed(2))

async function getAllIssues() {
    const result = []

    const per_page = 100

    console.log(`GET issues page=1 per_page=${per_page}`)
    const issues = await request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo,
        state: 'all',
        per_page,
        page: 1,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
    if (issues.status !== 200) {
        process.exit(-1)
    }
    result.push(...issues.data)

    const lastPage = getLastPage(issues.headers.link)
    const tasks = []
    for (let i = 2; i <= lastPage; i++) {
        console.log(`GET issues page=${i} per_page=${per_page}`)
        tasks.push(
            request('GET /repos/{owner}/{repo}/issues', {
                owner,
                repo,
                state: 'all',
                per_page,
                page: i,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }).then(issues => {
                if (issues.status !== 200) {
                    process.exit(-1)
                }
                result.push(...issues.data)
            })
        )
    }
    await Promise.all(tasks)

    return result.filter(issue => !issue.pull_request)
}

const issues = await getAllIssues()

const bugIssues = []
for (const issue of issues) {
    if (issue.labels.some(label => label.name.toLowerCase().includes('bug'))) {
        bugIssues.push(issue)
    }
}

const issueSpans = []
for (const issue of bugIssues) {
    const { closed_at, created_at } = issue
    if (closed_at) {
        const span = (new Date(closed_at) - new Date(created_at)) / (24 * 60 * 60 * 1000)
        issueSpans.push(span)
    }
}

console.log('issues number', issues.length)
console.log('closed bug issues number', issueSpans.length)
console.log('closed bug issues processing speed', quantile(issueSpans, 0.8).toFixed(2))
