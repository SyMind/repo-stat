# repo-stat

Calculate the processing speed of Issues and PRs in the GitHub repository.

# Usage

```
GITHUB_TOKEN=your_github_token && npm run start
```

# Algorithm

## Issues

1. Get all issues of a repository using GitHub's REST API.
2. Calculate the time interval between the closed time (closed_at) and the creation time (created_at) for each issues whose labels contain 'bug'.
3. Calculate the 80th percentile of all intervals.

## PRS

1. Get all pull requests of a repository using GitHub's REST API.
2. Calculate the time interval between the merge time (merged_at) and the creation time (created_at) for each pull request.
3. Calculate the 80th percentile of all intervals.

# Results

## Issues

| repo | all issues number | closed bug issues number | processing speed of issues (unit: days) |
| - | - | - | - |
| [Ant Design](https://github.com/ant-design/ant-design) | 42,164 | 1,999 | 18.92 |
| [Arco Design](https://github.com/arco-design/arco-design) | 2,106 | 513 | 3.68 |
| [Semi Design](https://github.com/DouyinFE/semi-design) | 1,719 | 330 | 36.44 |

## PRs

| repo | all PRs number | merged PRs number | processing speed of PRs (unit: days) |
| - | - | - | - |
| [Ant Design](https://github.com/ant-design/ant-design) | 14,911 | 11,756 | 1.06 |
| [Arco Design](https://github.com/arco-design/arco-design) | 1,028 | 901 | 1.63 |
| [Semi Design](https://github.com/DouyinFE/semi-design) | 941 | 851 | 5.16 |

# License

MIT
