<#  .Description
    Make new Challenger summary objects from objects in YAML from MySQL export

    .Example
    snippets_GenerateChallengerInfoFromMySQLExport.ps1 | Sort-Object ChallengerLastName | ConvertTo-Json | Out-File -Encoding ascii someStaticSite\challengerSummaryInfo.json
#>
#Requires -Modules powershell-yaml
param(
    ## Path to data input file
    [String]$Path = "$PSScriptRoot\data\challenge_data_as_obj.yaml"
)

process {
    $hshRecordBookInfo = Get-Content -Raw -Path $Path | ConvertFrom-Yaml

    $hshRecordBookInfo.RecordDetails | Group-Object -Property ChallengerID -PipelineVariable oThisGroupInfo | ForEach-Object {
        $oThisChallenger = $hshRecordBookInfo.Challengers.Where({$_.ChallengerID -eq $oThisGroupInfo.Name})
        ## if there is some display name for the challenger, return an object
        if (-not ([System.String]::IsNullOrEmpty(($strChallengerName = (($oThisChallenger.FirstName, $oThisChallenger.LastName) -join " ").Trim())))) {
            $arrChallengesThisPerson = $oThisGroupInfo.Group
            New-Object -TypeName PSObject -Property ([ordered]@{
                ChallengerName = $strChallengerName
                ChallengerLastName = $oThisChallenger.LastName
                ChallengerID = $oThisChallenger.ChallengerID
                Dept = $oThisChallenger.Dept
                NumChallenges = ($arrChallengesThisPerson | Measure-Object).Count
                NumCurrentRecords = ($arrChallengesThisPerson | Where-Object{$_.IsPreviousValue -eq 0 -and $_.bFailedToBeatExisting -eq 0} | Measure-Object).Count
                NumPrevRecords = ($arrChallengesThisPerson | Where-Object{$_.IsPreviousValue -eq 1} | Measure-Object).Count
                NumDNAG = ($arrChallengesThisPerson | Where-Object{$_.bDidNotAchieveGoal -eq 1} | Measure-Object).Count
                NumTies = ($arrChallengesThisPerson | Where-Object{$_.IsTie -eq 1} | Measure-Object).Count
                NumFailures = ($arrChallengesThisPerson | Where-Object{$_.bFailedToBeatExisting -eq 1} | Measure-Object).Count
            })
        }
    }
}