# repo-stat

Calculate the processing speed of PRs in the GitHub repository.

# Usage

```
GITHUB_TOKEN=your_github_token && npm run start
```

# Algorithm

1. Get all pull requests of a repository using GitHub's OpenAPI.
2. Calculate the time interval between the merge time (merged_at) and the creation time (created_at) for each pull request.
3. Calculate the 80th percentile of all intervals.

# Results

| repo | all PRs number | merged PRs number | processing speed of PRs (unit: days) |
| - | - | - | - |
| [Ant Design](https://github.com/ant-design/ant-design) | 14911 | 11756 | 1.06 |
| [Arco Design](https://github.com/arco-design/arco-design) | 1028 | 901 | 1.63 |
| [Semi Design](https://github.com/DouyinFE/semi-design) | 941 | 851 | 5.16 |

# License

MIT
