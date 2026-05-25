import 'package:flutter/material.dart';

import '../../../../core/theme/v_colors.dart';

class RecoveryStepPips extends StatelessWidget {
  const RecoveryStepPips({super.key, required this.active, this.total = 4});

  final int active;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 1; i <= total; i++) ...[
          Expanded(
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: i <= active
                    ? Vital30Colors.primary
                    : Vital30Colors.hairline,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          if (i < total) const SizedBox(width: 6),
        ],
      ],
    );
  }
}
