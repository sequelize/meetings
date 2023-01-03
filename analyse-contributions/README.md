# Analyse Contributions

This is a tiny tool to analyse the contributions of a the team members.
It will be used to calculate the eligible share of donations on a quarterly basis.

## How does it work

1. Get all members of the team
2. Get all contributions (issues, pull requests, comments, reviews) of the members
3. Calculate contributions per member based on the following scoring system
    - 10 points for each merged pull request
    - 50 points if that pull request is funded by a sponsor
    - 2 points for each created issue
    - 1 point for each comment or review comment
4. Share is calculated based on each member's points divided by the total amount of points

## Command

```
AUTH_TOKEN=<personal github token> QUARTER=2022-Q4 BALANCE=1234.56 yarn start
```

- `AUTH_TOKEN` is a github personal access token with `public_repo` scope
- `QUARTER` is the quarter for which the share should be calculated, format is `YYYY-QX` (e.g. `2022-Q4`)
- `BALANCE` is the total amount of donations for the quarter, which can be viewed on https://opencollective.com/sequelize
