Feature: Student listing and deletion
  The Student Management homepage shows a list of students and allows deleting a student.

  Background:
    Given the Student Management app is running

  @ui @smoke
  Scenario: TC-UI-001 [FR-001,FR-002] Student list section loads on homepage
    Given there is at least 1 student in the system
    When I open the homepage
    Then I should see the "Student List" section
    And I should see at least 1 student row in the list

  @ui
  Scenario: TC-UI-002 [FR-003] Student list displays required fields
    Given there is at least 1 student in the system
    When I open the homepage
    Then each student row should display id, name, email and department
    And each student row should display phone and status columns

  @ui @regression
  Scenario: TC-UI-003 [FR-004,FR-005,FR-006,FR-007] Delete removes student from UI without reload and shows success
    Given there is at least 1 student in the system
    When I open the homepage
    And I delete the first student from the list
    Then the student should be removed from the list without a full page reload
    And I should see a success message

  @ui @regression
  Scenario: TC-UI-004 [FR-008,BR-003] Deleting an already deleted student returns a meaningful API error and leaves the list stable
    Given there is at least 1 student in the system
    When I open the homepage
    And I delete the first student from the list
    And I attempt to delete the same student again via API
    Then the API should respond with a not-found error
    And the student list should remain unchanged

  @ui @regression
  Scenario: TC-UI-005 [FR-009] After creating a student, list refreshes automatically
    When I open the homepage
    And I create a new student via the UI form
    Then I should see the new student in the list
