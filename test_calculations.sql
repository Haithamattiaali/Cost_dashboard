-- Test calculations for department costs
-- According to user formulas:
-- PHs COST VALUE = total_incurred_cost - (Dist + Last Mile + PROCEED 3PL)
-- DAMASCO = PHs + Dist + Last Mile
-- PROCEED 3PL = 3PL WH + 3PL TRS

-- Get the raw values
SELECT
    printf('%.2f', SUM(total_incurred_cost)) as total_incurred,
    printf('%.2f', SUM(value_distribution)) as distribution,
    printf('%.2f', SUM(value_last_mile)) as last_mile,
    printf('%.2f', SUM(value_proceed_3pl_wh)) as proceed_3pl_wh,
    printf('%.2f', SUM(value_proceed_3pl_trs)) as proceed_3pl_trs
FROM cost_data;

-- Calculate PROCEED 3PL Total
SELECT
    printf('%.2f', SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs)) as proceed_3pl_total,
    printf('%.2f', SUM(value_proceed_3pl_wh)) as wh_component,
    printf('%.2f', SUM(value_proceed_3pl_trs)) as trs_component
FROM cost_data;

-- Calculate PHs using the formula
SELECT
    printf('%.2f', SUM(total_incurred_cost) - (SUM(value_distribution) + SUM(value_last_mile) + SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs))) as phs_calculated,
    printf('%.2f', SUM(total_incurred_cost)) as total,
    printf('%.2f', SUM(value_distribution) + SUM(value_last_mile) + SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs)) as sum_of_others
FROM cost_data;

-- Calculate DAMASCO (PHs + Dist + Last Mile)
SELECT
    printf('%.2f',
        (SUM(total_incurred_cost) - (SUM(value_distribution) + SUM(value_last_mile) + SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs))) +
        SUM(value_distribution) +
        SUM(value_last_mile)
    ) as damasco_total,
    printf('%.2f', SUM(total_incurred_cost) - (SUM(value_distribution) + SUM(value_last_mile) + SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs))) as phs_component,
    printf('%.2f', SUM(value_distribution)) as dist_component,
    printf('%.2f', SUM(value_last_mile)) as last_mile_component
FROM cost_data;

-- Verify the total equals sum of DAMASCO + PROCEED 3PL
SELECT
    printf('%.2f', SUM(total_incurred_cost)) as total_incurred,
    printf('%.2f',
        (SUM(total_incurred_cost) - (SUM(value_distribution) + SUM(value_last_mile) + SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs))) +
        SUM(value_distribution) +
        SUM(value_last_mile)
    ) as damasco,
    printf('%.2f', SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs)) as proceed_3pl,
    printf('%.2f',
        (SUM(total_incurred_cost) - (SUM(value_distribution) + SUM(value_last_mile) + SUM(value_proceed_3pl_wh) + SUM(value_proceed_3pl_trs))) +
        SUM(value_distribution) +
        SUM(value_last_mile) +
        SUM(value_proceed_3pl_wh) +
        SUM(value_proceed_3pl_trs)
    ) as sum_check
FROM cost_data;