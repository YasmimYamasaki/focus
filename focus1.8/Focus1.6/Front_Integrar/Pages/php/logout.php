<?php
session_start();
session_unset();
session_destroy();
header('Location: ../login.html');
echo json_encode(['success' => true]);
exit;
