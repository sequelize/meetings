# Analyse Contributions

This is a tiny tool to analyse the contributions of a the team members.
It will be used to calculate the eligible share of donations on a quarterly basis.

## How does it work

1. Get all members of the team
2. Get all contributions (issues, pull requests, comments) of the members
3. Calculate contributions per member based on the following scoring system
    - 2 points for each authored pull request
    - 1 point for each created issue
    - 1 point for each commented issue and pull request
4. Share is calculated based on each member's points divided by the total amount of points

## Command

```
AUTH_TOKEN=<personal github token> FROM=2021-10-01 BALANCE=1234.56 yarn start
```